using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using BlackstoneAI.Models;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace BlackstoneAI.Services;

// Manages the RPC pattern: publish request → wait for reply via correlation ID
public class ChatQueueService : IAsyncDisposable
{
    public const string RequestQueue = "blackstone.chat.requests";
    public const string ReplyQueue = "blackstone.chat.replies";

    private readonly IConnection _conn;
    private readonly IChannel _publishChannel;
    private readonly IChannel _replyChannel;
    private readonly ConcurrentDictionary<string, TaskCompletionSource<ChatResponse>> _pending = new();

    private ChatQueueService(IConnection conn, IChannel publishChannel, IChannel replyChannel)
    {
        _conn = conn;
        _publishChannel = publishChannel;
        _replyChannel = replyChannel;
    }

    public static async Task<ChatQueueService> CreateAsync(IConfiguration config)
    {
        var factory = new ConnectionFactory
        {
            HostName = config["RABBITMQ_HOST"] ?? "localhost",
            Port = int.Parse(config["RABBITMQ_PORT"] ?? "5672"),
            UserName = config["RABBITMQ_USER"] ?? "guest",
            Password = config["RABBITMQ_PASS"] ?? "guest",
        };

        var conn = await factory.CreateConnectionAsync();
        var pubCh = await conn.CreateChannelAsync();
        var replyCh = await conn.CreateChannelAsync();

        await pubCh.QueueDeclareAsync(RequestQueue, durable: true, exclusive: false, autoDelete: false);
        await replyCh.QueueDeclareAsync(ReplyQueue, durable: false, exclusive: false, autoDelete: false);

        var service = new ChatQueueService(conn, pubCh, replyCh);
        await service.StartReplyConsumerAsync();
        return service;
    }

    private async Task StartReplyConsumerAsync()
    {
        var consumer = new AsyncEventingBasicConsumer(_replyChannel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            var json = Encoding.UTF8.GetString(ea.Body.ToArray());
            var reply = JsonSerializer.Deserialize<ChatResponse>(json);
            if (reply is not null && _pending.TryRemove(reply.CorrelationId, out var tcs))
                tcs.TrySetResult(reply);
            await _replyChannel.BasicAckAsync(ea.DeliveryTag, false);
        };

        await _replyChannel.BasicConsumeAsync(ReplyQueue, autoAck: false, consumer: consumer);
    }

    public async Task<ChatResponse> SendAsync(ChatRequest request, TimeSpan timeout)
    {
        var tcs = new TaskCompletionSource<ChatResponse>(TaskCreationOptions.RunContinuationsAsynchronously);
        _pending[request.CorrelationId] = tcs;

        var json = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(request));
        var props = new BasicProperties { Persistent = true };
        await _publishChannel.BasicPublishAsync("", RequestQueue, mandatory: false, props, json);

        using var cts = new CancellationTokenSource(timeout);
        cts.Token.Register(() =>
        {
            if (_pending.TryRemove(request.CorrelationId, out var t))
                t.TrySetException(new TimeoutException("AI service did not respond in time."));
        });

        return await tcs.Task;
    }

    public async ValueTask DisposeAsync()
    {
        await _publishChannel.DisposeAsync();
        await _replyChannel.DisposeAsync();
        await _conn.DisposeAsync();
    }
}
