using System.Text;
using System.Text.Json;
using BlackstoneAI.Models;
using BlackstoneAI.Services;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace BlackstoneAI.Workers;

// Consumes chat.requests, processes AI + memory, publishes to chat.replies
public class ChatWorker(IConfiguration config, DeepSeekClient ai, MemoryService memory, RetrievalService retrieval, ILogger<ChatWorker> logger)
    : BackgroundService
{
    private IConnection? _conn;
    private IChannel? _channel;
    private IChannel? _replyChannel;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // Retry loop so the worker survives RabbitMQ restarts
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await ConnectAsync(ct);
                logger.LogInformation("ChatWorker connected to RabbitMQ, waiting for messages.");
                await Task.Delay(Timeout.Infinite, ct);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                logger.LogError(ex, "ChatWorker disconnected, retrying in 5s...");
                await Task.Delay(5_000, ct);
            }
        }
    }

    private async Task ConnectAsync(CancellationToken ct)
    {
        var factory = ChatQueueService.BuildFactory(config);

        _conn = await factory.CreateConnectionAsync(ct);
        _channel = await _conn.CreateChannelAsync(cancellationToken: ct);
        _replyChannel = await _conn.CreateChannelAsync(cancellationToken: ct);

        await _channel.QueueDeclareAsync(ChatQueueService.RequestQueue, durable: true, exclusive: false, autoDelete: false, cancellationToken: ct);
        await _replyChannel.QueueDeclareAsync(ChatQueueService.ReplyQueue, durable: false, exclusive: false, autoDelete: false, cancellationToken: ct);
        await _channel.BasicQosAsync(0, prefetchCount: 4, global: false, cancellationToken: ct);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            ChatResponse reply;
            ChatRequest? req = null;
            try
            {
                req = JsonSerializer.Deserialize<ChatRequest>(Encoding.UTF8.GetString(ea.Body.ToArray()));
                if (req is null) throw new InvalidOperationException("Null request");

                var memTask = memory.GetContextAsync(req.UserId);
                var ragTask = retrieval.RetrieveContextAsync(req.Message);
                await Task.WhenAll(memTask, ragTask);
                var memCtx = memTask.Result;
                var ragContext = ragTask.Result;

                var answer = await ai.ChatAsync(memCtx.RecentMessages, req.Message, ragContext, memCtx.Summary);

                _ = Task.Run(() => memory.SaveAndCompressAsync(req.UserId, req.Message, answer ?? ""));

                reply = new ChatResponse(req.CorrelationId, answer, null);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to process chat request");
                reply = new ChatResponse(req?.CorrelationId ?? "", null, "AI processing failed.");
            }

            var json = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(reply));
            await _replyChannel!.BasicPublishAsync("", ChatQueueService.ReplyQueue, mandatory: false, new BasicProperties(), json);
            await _channel!.BasicAckAsync(ea.DeliveryTag, false);
        };

        await _channel.BasicConsumeAsync(ChatQueueService.RequestQueue, autoAck: false, consumer: consumer, cancellationToken: ct);
    }

    public override async Task StopAsync(CancellationToken ct)
    {
        await base.StopAsync(ct);
        if (_channel is not null) await _channel.DisposeAsync();
        if (_replyChannel is not null) await _replyChannel.DisposeAsync();
        if (_conn is not null) await _conn.DisposeAsync();
    }
}
