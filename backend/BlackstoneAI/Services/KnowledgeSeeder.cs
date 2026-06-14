using Npgsql;

namespace BlackstoneAI.Services;

public class KnowledgeSeeder(IConfiguration config)
{
    private readonly string _connStr = MemoryService.ParseConnStr(config["DATABASE_URL"]!);

    public async Task SeedIfEmptyAsync()
    {
        await using var conn = new NpgsqlConnection(_connStr);
        await conn.OpenAsync();

        long count;
        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM knowledge_chunks", conn))
            count = (long)(await cmd.ExecuteScalarAsync())!;

        if (count > 0) return;

        foreach (var doc in KnowledgeData.All)
        {
            await using var cmd = new NpgsqlCommand(
                "INSERT INTO knowledge_chunks (source, category, content) VALUES ($1, $2, $3)", conn);
            cmd.Parameters.AddWithValue(doc.Source);
            cmd.Parameters.AddWithValue(doc.Category);
            cmd.Parameters.AddWithValue(doc.Content);
            await cmd.ExecuteNonQueryAsync();
        }
    }
}

file record KnowledgeDoc(string Source, string Category, string Content);

file static class KnowledgeData
{
    public static readonly KnowledgeDoc[] All =
    [
        // Company Overview
        new("homepage", "company-overview", "Blackstone is the world's largest alternative asset manager, with $1.3 trillion in assets under management as of Q1 2026. The firm was founded in 1985 by Stephen Schwarzman and Peter Peterson and is headquartered in New York City."),
        new("about", "company-overview", "Blackstone's mission is to create long-term value for its investors through disciplined investing across alternative asset classes. The firm manages capital on behalf of institutional and individual investors worldwide, including pension funds, sovereign wealth funds, insurance companies, endowments, and high-net-worth individuals."),
        new("about", "company-overview", "Blackstone is publicly traded on the New York Stock Exchange under the ticker symbol BX. It is structured as a partnership and has offices in more than 20 cities globally, including London, Hong Kong, Singapore, Mumbai, Sydney, Tokyo, and Dubai."),
        new("about", "company-overview", "Blackstone employs over 4,700 people globally, including more than 1,000 investment professionals. The firm has approximately 230 institutional clients and manages investments across real estate, private equity, credit, and multi-asset strategies."),

        // Real Estate
        new("real-estate", "real-estate", "Blackstone Real Estate is the world's largest real estate private equity firm, with approximately $336 billion in assets under management. It invests across all major property types including logistics, rental housing, office, retail, hospitality, and life sciences."),
        new("real-estate", "real-estate", "Blackstone Real Estate operates through two primary strategies: opportunistic investing, which targets higher returns through value-add and development; and Core+ investing, which targets stable income-generating assets. Both strategies operate globally across the Americas, Europe, and Asia."),
        new("real-estate", "real-estate", "BREIT (Blackstone Real Estate Income Trust) is a non-traded REIT that provides individual investors access to Blackstone's institutional-quality real estate investments. BREIT focuses on stabilized, income-generating commercial real estate in the United States, primarily in the logistics and residential sectors."),
        new("real-estate", "real-estate", "Blackstone owns approximately 12,500 real estate assets worldwide. Major investments include large logistics and industrial portfolios, student housing platforms, single-family rental homes, and hotel and resort properties across multiple continents."),
        new("real-estate", "real-estate", "Blackstone's real estate portfolio is heavily weighted toward high-conviction thematic investments — sectors supported by long-term structural tailwinds such as e-commerce-driven logistics demand, housing shortages in major cities, and the growth of the digital economy requiring data center infrastructure."),

        // Private Equity
        new("private-equity", "private-equity", "Blackstone Private Equity manages approximately $345 billion in assets and is one of the largest private equity investors in the world. It invests in companies across a wide range of industries including technology, healthcare, financial services, consumer, energy, and industrials."),
        new("private-equity", "private-equity", "Blackstone's private equity strategy focuses on partnering with management teams to build great businesses. The firm's portfolio includes over 250 companies globally, employing approximately 900,000 people. Blackstone uses its operational expertise, global network, and strategic resources to drive value creation."),
        new("private-equity", "private-equity", "Blackstone's private equity platform includes several distinct strategies: corporate private equity, which makes large-scale buyout investments; tactical opportunities, which pursues special situations and stressed assets; and secondary investments, which acquire existing private equity portfolios from other investors."),
        new("private-equity", "private-equity", "Blackstone's portfolio operations team works hands-on with portfolio companies to improve performance in procurement, talent management, technology, and revenue growth. This operational value creation is a key differentiator for Blackstone compared to financial-engineering-focused competitors."),

        // Credit & Insurance
        new("credit", "credit-insurance", "Blackstone Credit & Insurance (BXCI) is one of the largest credit-focused alternative asset managers, with approximately $354 billion in assets under management. It spans liquid and illiquid credit strategies across corporate credit, asset-based lending, real estate debt, and insurance solutions."),
        new("credit", "credit-insurance", "BCRED (Blackstone Private Credit Fund) is a non-traded Business Development Company (BDC) that provides individual investors access to Blackstone's private credit capabilities. BCRED focuses on floating-rate, senior secured direct loans to U.S. middle market and upper middle market companies."),
        new("credit", "credit-insurance", "Blackstone's direct lending business provides first-lien senior secured loans directly to companies, bypassing traditional bank intermediaries. This allows Blackstone to offer more flexible terms than banks and earn an illiquidity premium over broadly syndicated loans."),
        new("credit", "credit-insurance", "Blackstone's insurance solutions platform partners with insurance companies to provide liability-driven investment strategies. Blackstone manages investment portfolios for insurance clients seeking higher-yielding, alternative credit assets that match their long-duration liabilities."),

        // Multi-Asset
        new("multi-asset", "multi-asset", "Blackstone Multi-Asset Investing (BXMA) manages approximately $83 billion in assets and provides customized investment solutions that combine exposure to Blackstone's alternative strategies with traditional asset classes. It serves institutional clients and high-net-worth investors seeking diversified portfolios."),
        new("multi-asset", "multi-asset", "BMACX (Blackstone Multi-Asset Investing Fund) is a registered closed-end fund available to individual investors through financial advisors. It provides diversified exposure to Blackstone's alternative investment strategies within a single vehicle."),

        // Private Wealth
        new("private-wealth", "private-wealth", "Blackstone's private wealth solutions business partners with financial advisors to bring the firm's institutional-quality alternative investment capabilities to qualified individual investors. Key products include BREIT (real estate), BCRED (private credit), and BMACX (multi-asset)."),
        new("private-wealth", "private-wealth", "Blackstone has invested heavily in building infrastructure to serve individual investors, including a dedicated team of wealth management professionals, educational resources for financial advisors, and product structures designed to provide liquidity, tax efficiency, and simplicity for non-institutional investors."),
        new("private-wealth", "private-wealth", "Individual investors can access Blackstone products through their financial advisors. Blackstone's private wealth products are designed for accredited investors and qualified purchasers, depending on the specific product. Minimums and eligibility requirements vary by fund."),

        // Earnings & Financials
        new("earnings", "earnings-financials", "Blackstone reported Q1 2026 distributable earnings of approximately $1.2 billion, with fee-related earnings of $980 million. The firm saw $41 billion in inflows during the quarter, reflecting continued strong demand from both institutional and individual investors."),
        new("earnings", "earnings-financials", "Blackstone's total assets under management reached $1.3 trillion in Q1 2026, growing from $1.1 trillion in the prior year. The firm's perpetual capital vehicles — long-duration funds that do not have defined end dates — now represent a majority of total AUM."),
        new("earnings", "earnings-financials", "Blackstone pays a quarterly dividend to common shareholders. The dividend is variable and based on distributable earnings. Shareholders can access earnings presentations, press releases, SEC filings, and webcast replays through Blackstone's investor relations website."),
        new("earnings", "earnings-financials", "Blackstone's fee-related earnings are driven by management fees on its perpetual capital vehicles and drawdown funds, as well as fee revenues from its real estate and credit businesses. The firm has grown fee-related earnings significantly as its perpetual capital base has scaled."),

        // Leadership
        new("leadership", "leadership", "Stephen A. Schwarzman is the Chairman, CEO, and Co-Founder of Blackstone. He co-founded the firm in 1985 and has led it through its growth from a boutique advisory firm to the world's largest alternative asset manager. He is also a prominent philanthropist."),
        new("leadership", "leadership", "Jonathan D. Gray is President and Chief Operating Officer of Blackstone. He joined the firm in 1992 and built Blackstone's real estate business into the largest in the world before becoming COO. He is widely regarded as one of the leading real estate investors of his generation."),
        new("leadership", "leadership", "Michael Chae is Chief Financial Officer of Blackstone. He oversees the firm's global finance, accounting, tax, and treasury functions. Blackstone's senior leadership team also includes the heads of each major business — real estate, private equity, credit, and multi-asset investing."),

        // Sustainability
        new("sustainability", "sustainability", "Blackstone integrates environmental, social, and governance (ESG) considerations into its investment process. The firm has committed to reducing carbon emissions across its real estate portfolio, investing in energy efficiency, and transitioning to renewable energy across its owned properties."),
        new("sustainability", "sustainability", "Blackstone's sustainability program includes a commitment to improve the energy efficiency of each new real estate acquisition by 15% within the first few years of ownership. The firm has also made significant investments in renewable energy, battery storage, and green infrastructure."),
        new("sustainability", "sustainability", "Blackstone publishes an annual TCFD-aligned sustainability report detailing progress on its ESG goals, carbon footprint, diversity metrics, and community investment. The firm is a signatory to the UN Principles for Responsible Investment (UNPRI)."),

        // FAQ
        new("faq", "faq", "How can I invest with Blackstone? Individual investors can access Blackstone products such as BREIT, BCRED, and BMACX through their financial advisors. These products are available to accredited investors. Institutional investors should contact Blackstone's investor relations team directly."),
        new("faq", "faq", "What is Blackstone's stock ticker? Blackstone is publicly traded on the NYSE under the ticker symbol BX. Common shareholders receive quarterly dividends based on distributable earnings."),
        new("faq", "faq", "How does Blackstone make money? Blackstone earns management fees (typically 1-2% of assets managed), performance fees or carried interest (typically 20% of profits above a hurdle rate), and fee revenues from its credit and insurance businesses."),
        new("faq", "faq", "What is the difference between BREIT and a public REIT? BREIT is a non-traded REIT, meaning its shares are not listed on a public stock exchange. This structure reduces short-term price volatility and allows BREIT to hold assets for longer periods. However, redemptions are subject to quarterly limits."),
        new("faq", "faq", "How do I contact Blackstone? Investors can contact Blackstone's investor relations team through the Shareholders section of blackstone.com. Financial advisors can contact the private wealth solutions team. Media inquiries should be directed to Blackstone's communications department."),
        new("faq", "faq", "What industries does Blackstone's private equity business invest in? Blackstone invests across technology, healthcare, financial services, consumer, energy, media, industrials, and more. The firm looks for businesses with strong competitive positions, recurring revenue, and significant potential for operational improvement."),
    ];
}
