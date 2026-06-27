export const metadata = {
  title: "Writing – Calum Macdonald",
};

const externalLinks = [
  {
    href: "https://medium.com/0xintuition",
    label: "Intuition Protocol — Medium",
    desc: "Long-form pieces on knowledge graphs, trust infrastructure, and the open semantic web.",
    tag: "MEDIUM",
  },
  {
    href: "https://x.com/0xIntuition/articles",
    label: "Intuition Protocol — X Articles",
    desc: "Threads and articles on AI agents, onchain attestation, and protocol development.",
    tag: "X / TWITTER",
  },
];

const essays = [
  {
    href: "/Open-Source-Open-Season.pdf",
    label: "Open Source, Open Season: Why AI Has Broken DeFi's Risk Premium",
    desc: "How AI has permanently altered DeFi's risk profile — and why the yield premium no longer compensates for a new, unquantifiable attack variable.",
    tag: "ESSAY (PDF)",
  },
];

export default function Writing() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-16">
        <p className="font-mono text-blue-400 text-sm mb-3 tracking-widest uppercase">Writing</p>
        <h1 className="text-4xl font-bold text-zinc-100 mb-4 tracking-tight">Articles & Research</h1>
        <p className="text-zinc-400 leading-relaxed">
          Writing on AI agents, knowledge infrastructure, crypto markets, and data systems.
        </p>
      </div>

      {/* Essays */}
      <div className="mb-16">
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">Essays</p>
        <div className="flex flex-col gap-3">
          {essays.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-600 hover:bg-zinc-900 transition-all"
            >
              <div>
                <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded mb-2 inline-block">
                  {link.tag}
                </span>
                <h3 className="text-zinc-100 font-semibold mb-1">{link.label}</h3>
                <p className="text-zinc-500 text-sm">{link.desc}</p>
              </div>
              <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors pt-1 shrink-0">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* External publications */}
      <div className="mb-16">
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">Publications</p>
        <div className="flex flex-col gap-3">
          {externalLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-600 hover:bg-zinc-900 transition-all"
            >
              <div>
                <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded mb-2 inline-block">
                  {link.tag}
                </span>
                <h3 className="text-zinc-100 font-semibold mb-1">{link.label}</h3>
                <p className="text-zinc-500 text-sm">{link.desc}</p>
              </div>
              <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors pt-1 shrink-0">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* Embedded article */}
      <div>
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-6">Featured Article</p>
        <article className="prose-article">
          <h2 className="text-2xl font-bold text-zinc-100 mb-2 leading-snug">
            Intuition as the Open Knowledge Graph for AI Agents
          </h2>
          <p className="font-mono text-xs text-zinc-500 mb-8">Published via Intuition Protocol</p>

          <div className="space-y-5 text-zinc-300 leading-relaxed text-[15px]">
            <p>
              The central challenge of autonomous AI agents is not capability — it is epistemology. An agent can browse
              the web, execute transactions, write code, and coordinate with other agents. What it cannot do reliably is
              assess the credibility of what it encounters while doing so. It has no robust way to evaluate whether a
              piece of information is accurate, whether a counterparty is trustworthy, or whether another agent&apos;s
              claimed capabilities correspond to a real track record.
            </p>
            <p>
              This is not a peripheral problem. It sits at the core of what it means to act intelligently in an open,
              adversarial environment. An agent that cannot distinguish reliable information from unreliable information,
              or trustworthy participants from untrustworthy ones, is not reasoning about the world — it is
              pattern-matching against its training data and hoping the world has not changed. That is a poor substitute
              for genuine situational awareness.
            </p>
            <p>
              The question, then, is where agents should get their epistemic grounding. The answer most current systems
              implicitly give — training data supplemented by live retrieval from centralized sources — has obvious
              limitations. Training data is static and reflects the distribution of text produced before a cutoff date.
              Centralized APIs produce scores and labels with no transparency into how those outputs were derived or who
              was responsible for them. Neither approach gives an agent a way to reason about why it should trust a
              source, or to update that assessment as new information accumulates.
            </p>

            <h3 className="text-lg font-semibold text-zinc-100 pt-4">The Emerging Consensus — and Its Blind Spot</h3>
            <p>
              The AI infrastructure industry has already started answering the knowledge problem. Large language models
              are extraordinary at reasoning, generation, and pattern recognition, but they have structural limitations
              that no amount of additional training resolves. They hallucinate — producing confident, plausible-sounding
              information that is factually wrong. Their knowledge is frozen at training time, unable to track how
              entities and relationships have evolved. They cannot provide deterministic, exhaustive answers when agents
              need verifiable recall rather than probabilistic best guesses. And they carry no provenance — no audit
              trail that lets a downstream system trace where a piece of information came from or assess the basis on
              which it was generated.
            </p>
            <p>
              These are not bugs to be fixed in the next model release. They are structural properties of how language
              models work. The response the industry is converging on is a hybrid architecture: LLM reasoning paired
              with a structured knowledge graph. OpenAI has published tooling demonstrating agents that extract
              structured knowledge, build graphs, and traverse them in multi-hop reasoning chains. Andrew Ng and
              DeepLearning.AI have launched courses on agentic knowledge graph construction. Neo4j, LangChain, and a
              growing number of infrastructure projects are racing to build graph-based tooling for agents. The
              consensus is no longer forming — it has formed. Knowledge graphs are essential infrastructure for
              production AI agents.
            </p>
            <p>
              But every existing implementation of this architecture assumes a private graph. Each agent or application
              builds its own graph from its own data for its own use. This is sufficient for closed systems. It fails
              the moment agents from different frameworks, different companies, and different ecosystems need to interact
              with entities they have never encountered. The open agentic web requires a shared knowledge layer — one
              that is public, permissionless, and not controlled by any single party with competing interests.
            </p>
            <p>
              And then there is the trust problem, which private graph architectures do not solve at all. In a private
              graph, trust is simple: the operator controls the data ingestion pipeline and trusts their own sources. In
              a public graph, trust is the entire game. Anyone can add data. Anyone can make claims. Traditional
              knowledge graph architectures handle structure, deterministic queries, and temporal evolution well. They
              have no native mechanism for establishing which claims are credible and which are not. Human moderators do
              not scale. AI validators can be gamed. Reputation scores raise the question of who scores the scorers.
              What a public knowledge graph requires is an economic mechanism — one where asserting information requires
              putting real value at risk, where the cost of misinformation is concrete, and where the market
              continuously discovers which claims are worth endorsing.
            </p>

            <h3 className="text-lg font-semibold text-zinc-100 pt-4">
              The Epistemological Requirements of Autonomous Agents
            </h3>
            <p>Consider what an agent actually needs to know in order to operate well in the world.</p>
            <p>
              It needs knowledge about people — not just biographical facts, but assessments of their credibility on
              particular topics, the quality of their past contributions, and what the broader network of informed
              participants thinks of them. This is the kind of contextual reputation knowledge that humans accumulate
              through social experience and find difficult to articulate but rely on constantly.
            </p>
            <p>
              It needs knowledge about other agents — what they are capable of, what their track record looks like,
              whether their past outputs have been validated or found wanting. As multi-agent systems become more
              complex, this becomes increasingly important: an agent delegating a task to another agent needs some basis
              for that delegation beyond the other agent&apos;s own self-description.
            </p>
            <p>
              It needs knowledge about information — not just content, but epistemic status. Which claims are
              well-supported by people with relevant expertise? Which are contested and on what grounds? Where is there
              genuine uncertainty versus manufactured controversy? The difference between a contested scientific
              question and a settled one is not always visible in the text of the claims themselves.
            </p>
            <p>
              And it needs all of this in a form it can actually use — structured, queryable, and carrying enough
              metadata to reason about confidence levels and the basis for assessments.
            </p>

            <h3 className="text-lg font-semibold text-zinc-100 pt-4">Stake-Weighted Signal as Epistemic Infrastructure</h3>
            <p>
              Intuition is a permissionless knowledge graph in which entities and relationships are encoded onchain as
              Atoms and Triples — the standard subject–predicate–object structure of semantic knowledge representation.
              What distinguishes it from a conventional knowledge base is the economic layer governing participation. In
              most current systems, credibility is either inferred statistically or assigned administratively. In
              neither case is it economically contested.
            </p>
            <p>
              Every node in the Intuition graph has an associated vault. Participants deposit $TRUST to endorse a piece
              of information — to signal that they regard it as accurate, important, or otherwise worth the
              network&apos;s attention. The bonding curve mechanics mean that early endorsers who are later validated by
              broader participation earn a return; those who stake on information the network ultimately rejects lose
              ground. The result is an incentive structure in which participants have a concrete stake in the accuracy
              of what they endorse.
            </p>
            <p>
              This produces something significant: not just claims about the world, but claims with attached evidence
              about how many participants considered them worth endorsing, how much they were willing to risk on that
              endorsement, and how the network&apos;s aggregate assessment has moved over time. For an agent querying
              the graph, this is not an opaque score from an unknown source. It is a transparent record of distributed
              human judgment, carrying information about the depth and composition of that judgment.
            </p>
            <p>
              The philosophical lineage here is worth noting. The idea that market prices aggregate dispersed
              information better than any centralized authority can is one of the foundational arguments in economics.
              What Intuition applies to knowledge is a version of the same logic: that credibility assessments produced
              by participants with real stakes in accuracy will be more reliable than those produced by parties with no
              skin in the game. The mechanism differs from a price signal, but the underlying principle is the same —
              economic commitment as a filter for epistemic seriousness.
            </p>

            <h3 className="text-lg font-semibold text-zinc-100 pt-4">
              Agents as Participants in a Permanent Shared Record
            </h3>
            <p>
              The more interesting dimension of this architecture is not that agents can query the knowledge graph. It
              is that they can contribute to it.
            </p>
            <p>
              An agent that interacts with a person, verifies a claim, or works alongside another agent has produced
              firsthand knowledge that may be genuinely valuable to the network. If that agent can stake on what it has
              learned — recording its assessment in the graph under the same economic rules that apply to human
              participants — its observations become part of a shared record that benefits every subsequent agent
              querying that information.
            </p>
            <p>
              This creates an alignment property worth taking seriously. Under a pure task-completion framework, an
              agent has no incentive to care about the quality of information it passes on — it is optimizing for the
              local objective. Under Intuition&apos;s model, an agent that consistently surfaces accurate signal early
              earns a return; one that stakes on low-quality or inaccurate information loses ground. The economic
              incentive structure extends to agents the same pressure toward accuracy that it applies to human
              participants. An agent&apos;s credibility becomes measurable not by its self-description, but by its
              staking history. This transforms agents from passive consumers of trust signals into accountable
              participants in their production.
            </p>
            <p>
              The outcome is a knowledge graph that is not merely a record of human judgment, but shared
              infrastructure to which both humans and agents contribute, under a common set of rules, in pursuit of a
              common good: a more accurate and reliable representation of what the network collectively knows.
            </p>

            <h3 className="text-lg font-semibold text-zinc-100 pt-4">Coordination in Multi-Agent Systems</h3>
            <p>
              The coordination problem in multi-agent systems is distinct from the general trust problem. When an agent
              needs to assess a human&apos;s credibility, it is drawing on a long-standing base of human-generated
              signal. When it needs to assess another agent, it is operating in a domain where track records are
              shorter, self-descriptions are easy to fabricate, and the consequences of misplaced trust can cascade
              rapidly through a pipeline of dependent tasks.
            </p>
            <p>
              Consider what that failure looks like concretely. An agent delegates a research task to a second agent
              whose capabilities it cannot verify. That agent produces outputs it cannot distinguish from reliable
              work. A third agent acts on those outputs. The error compounds at each step, and by the time it becomes
              visible, it is embedded in decisions and records that are difficult to unwind. In a world where agent
              pipelines are short and human oversight is frequent, this is manageable. In a world where those pipelines
              are long, fast, and only intermittently supervised, it is a structural vulnerability — one that no
              individual agent can address on its own.
            </p>
            <p>
              The conventional solution is centralized brokerage: a platform or registry that certifies agents, assigns
              them scores, and mediates coordination. The limitations of this approach are structural. Any centralized
              authority introduces a single point of capture — whoever controls the registry controls which agents get
              access and on what terms. It also introduces opacity: the basis for certification decisions is not visible
              to the agents relying on them.
            </p>
            <p>
              A shared knowledge graph offers a different model. An agent assessing a potential collaborator can query
              the graph for a record of that agent&apos;s claimed capabilities alongside the network&apos;s assessment
              of those claims, a history of its past outputs, and any endorsements or disputes from participants who
              have direct experience with it. This assessment is not produced by any single authority — it is the
              aggregate of distributed observations, each carrying information about the observer&apos;s own standing
              in the network.
            </p>
            <p>
              The result is coordination infrastructure that is composable, portable across applications, and resistant
              to capture by any single platform. The openness is not incidental — it means no platform can unilaterally
              determine which agents are credible or on what terms.
            </p>

            <h3 className="text-lg font-semibold text-zinc-100 pt-4">The Default and the Alternative</h3>
            <p>
              The question of where agents get their understanding of the world is being answered now, largely by
              default. The answer that most systems are implicitly converging on — training data plus centralized
              retrieval plus opaque scoring — is not the result of careful deliberation about what agents actually
              need. It is the path of least resistance, given the tools that currently exist.
            </p>
            <p>
              The cost of that choice is not obvious in any individual agent interaction. It becomes visible in
              aggregate, as autonomous systems operating at scale make consequential decisions based on foundations they
              cannot articulate and cannot update. The quality of the knowledge graph that agents draw on is not a
              secondary engineering concern — it is constitutive of how well those systems can reason about the world
              they are operating in.
            </p>
            <p>
              Intuition represents a deliberate alternative: an open, economically-secured infrastructure layer that
              agents can query with transparency into how its outputs were produced, and to which they can contribute
              on the same terms as the humans who built it.
            </p>
            <p className="text-zinc-200 font-medium">
              Every agent will rely on some epistemic substrate. The only question is whether that substrate is
              transparent and economically secured — or opaque and centrally-controlled.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
