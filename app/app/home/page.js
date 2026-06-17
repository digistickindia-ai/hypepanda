"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { loadMe, inr, fmtFollowers, NICHES } from "@/lib/me";
import Panda from "../../Panda";
import Icon from "../../Icon";
import TabBar from "../TabBar";
import NotificationBell from "../NotificationBell";

function HomeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/app"); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile || !profile.onboarding_done) {
      const role = params.get("role") || "creator";
      router.replace("/app/onboarding?role=" + role);
      return;
    }
    if (profile.role === "creator" && !profile.showcase_done) {
      router.replace("/app/onboarding/showcase");
      return;
    }
    if (profile.suspended) { await supabase.auth.signOut(); router.replace("/?suspended=1"); return; }
    setMe({ user, profile, supabase });
    setLoading(false);
  })(); }, []);

  if (loading) return <Loader />;

  return me.profile.role === "creator"
    ? <CreatorHome me={me} router={router} />
    : <BusinessHome me={me} router={router} />;
}

export default function Home() {
  return (
    <Suspense fallback={<Loader />}>
      <HomeInner />
    </Suspense>
  );
}

function Loader() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="blob"><svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="32" fill="var(--yellow)" />
        <circle cx="31" cy="35" r="6" fill="#fff" /><circle cx="32" cy="36" r="3" fill="var(--ink)" />
        <circle cx="49" cy="35" r="6" fill="#fff" /><circle cx="50" cy="36" r="3" fill="var(--ink)" />
        <path d="M31 50 Q40 58 51 48" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg></div>
    </main>
  );
}

/* ---------------- CREATOR HOME ---------------- */
function CreatorHome({ me, router }) {
  const p = me.profile;
  const first = (p.full_name || "there").split(" ")[0];
  const [data, setData] = useState(null);

  useEffect(() => { (async () => {
    const { data: deals } = await me.supabase.from("deals").select("*").eq("creator_id", p.id).order("updated_at", { ascending: false });
    const list = deals || [];
    const { data: reels } = await me.supabase.from("portfolio").select("*").eq("creator_id", p.id).order("created_at", { ascending: false });
    // business names for offers
    const bizIds = [...new Set(list.map((d) => d.business_id))];
    let biz = {};
    if (bizIds.length) {
      const { data: bp } = await me.supabase.from("profiles").select("id, full_name, company_name").in("id", bizIds);
      (bp || []).forEach((x) => { biz[x.id] = x; });
    }
    const earnings = list.filter((d) => d.payment_status === "paid_out").reduce((s, d) => s + (d.payout_amount || 0), 0);
    setData({
      earnings,
      active: list.filter((d) => ["accepted", "in_progress", "delivered"].includes(d.status)),
      offers: list.filter((d) => d.status === "pending"),
      completedCount: list.filter((d) => d.status === "completed").length,
      reels: reels || [],
      biz,
    });
  })(); }, []);

  const pro = p.is_pro && p.pro_until && new Date(p.pro_until).getTime() > Date.now();
  const strength = p.instagram_connected ? 100 : 80;

  return (
    <Shell>
      {/* Greeting + earnings chip */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, margin: 0 }}>Hey {first}</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "2px 0 0" }}>Your panda HQ</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 18, padding: "8px 14px", textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Earned</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>{data ? inr(data.earnings) : "…"}</div>
          </div>
          <NotificationBell supabase={me.supabase} userId={p.id} />
        </div>
      </div>

      {/* Featured: profile strength OR all-good */}
      {strength < 100 ? (
        <div style={{ background: "var(--coral)", borderRadius: 24, padding: 22, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#712B13", textTransform: "uppercase", letterSpacing: "0.5px" }}>Profile strength</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#4A1B0C", margin: "4px 0 6px" }}>{strength}%</div>
          <div style={{ height: 8, background: "rgba(74,27,12,0.18)", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ width: strength + "%", height: "100%", background: "#4A1B0C" }} />
          </div>
          <button onClick={() => router.push("/app/profile")} className="pressable" style={{ background: "#4A1B0C", color: "#fff", border: "none", borderRadius: 20, padding: "11px 20px", fontSize: 14, fontWeight: 800 }}>
            Verify Instagram to hit 100% →
          </button>
        </div>
      ) : (
        <div style={{ background: "var(--blue)", borderRadius: 24, padding: 22, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <Panda size={64} animate={false} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>You&apos;re all set!</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Your profile is complete. Brands can find &amp; hire you.</div>
          </div>
        </div>
      )}

      {/* Go Pro card (if not pro) */}
      {!pro && (
        <div onClick={() => router.push("/app/pro")} className="pressable" style={{ background: "var(--ink)", borderRadius: 22, padding: 18, marginBottom: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Panda size={32} animate={false} />
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Go Pro</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", marginTop: 6 }}>Get featured, pay 5% not 10%, see who viewed you.</div>
          </div>
          <span style={{ background: "var(--yellow)", color: "#412402", fontSize: 13, fontWeight: 800, padding: "8px 14px", borderRadius: 14, flexShrink: 0 }}>Upgrade</span>
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <Stat big={p.niche} small="niche" />
        <Stat big={inr(p.rate_per_post)} small="per post" />
        <Stat big={p.instagram_connected ? fmtFollowers(p.followers) : "—"} small="followers" />
      </div>

      {/* New offers */}
      <Section title="New offers" count={data?.offers.length} onAll={data?.offers.length ? () => router.push("/app/deals") : null}>
        {!data ? <Skel /> : data.offers.length === 0 ? (
          <EmptyRow text="No new offers right now. Keep your reels fresh!" />
        ) : (
          <Row>
            {data.offers.map((d) => (
              <MiniCard key={d.id} onClick={() => router.push("/app/chat/" + d.id)} accent="var(--pink)"
                top={inr(d.amount)} title={d.title}
                sub={(data.biz[d.business_id]?.company_name || data.biz[d.business_id]?.full_name || "A brand")} />
            ))}
          </Row>
        )}
      </Section>

      {/* Active deals */}
      <Section title="Active deals" count={data?.active.length} onAll={data?.active.length ? () => router.push("/app/deals") : null}>
        {!data ? <Skel /> : data.active.length === 0 ? (
          <EmptyRow text="No active deals yet. Accepted offers show here." />
        ) : (
          <Row>
            {data.active.map((d) => (
              <MiniCard key={d.id} onClick={() => router.push("/app/chat/" + d.id)} accent="var(--blue)"
                top={inr(d.amount)} title={d.title} sub={(d.status || "").replace("_", " ")} />
            ))}
          </Row>
        )}
      </Section>

      {/* Earnings summary */}
      <Section title="Earnings">
        <div style={{ display: "flex", gap: 10 }}>
          <Stat big={data ? inr(data.earnings) : "…"} small="paid out" />
          <Stat big={data ? String(data.completedCount) : "…"} small="completed" />
          <Stat big={data ? String(data.active.length) : "…"} small="in progress" />
        </div>
      </Section>

      {/* Your reels */}
      <Section title="Your showcase" count={data?.reels.length} onAll={() => router.push("/app/profile")}>
        {!data ? <Skel /> : data.reels.length === 0 ? (
          <EmptyRow text="Add reels from your profile to get discovered." />
        ) : (
          <Row>
            {data.reels.map((v) => (
              <div key={v.id} onClick={() => router.push("/app/profile")} style={{ width: 120, flexShrink: 0, cursor: "pointer" }}>
                <div style={{ width: 120, height: 160, borderRadius: 14, overflow: "hidden", background: "#000", position: "relative" }}>
                  <video src={v.video_url} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", bottom: 6, left: 6, fontSize: 10, fontWeight: 800, color: "#fff", background: v.status === "approved" ? "rgba(27,52,4,0.8)" : v.status === "pending" ? "rgba(133,79,11,0.85)" : "rgba(163,45,45,0.85)", padding: "2px 7px", borderRadius: 8 }}>
                    {v.status === "approved" ? "Live" : v.status === "pending" ? "Pending" : "Rejected"}
                  </span>
                </div>
              </div>
            ))}
          </Row>
        )}
      </Section>

      {/* Tips */}
      <Section title="Tips to get hired">
        <Row>
          <TipCard icon="film" text="Post 2-3 strong reels — brands judge fast." />
          <TipCard icon="check" text="Verify Instagram to show real follower counts." />
          <TipCard icon="bolt" text="Reply to offers quickly to win more deals." />
          <TipCard icon="rocket" text="Go Pro to appear first in search." />
        </Row>
      </Section>
    </Shell>
  );
}

/* dashboard helpers */
function Section({ title, count, onAll, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
          {title}{count != null && count > 0 ? <span style={{ color: "var(--faint)", fontWeight: 700 }}> · {count}</span> : ""}
        </h2>
        {onAll && <button onClick={onAll} style={{ fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>See all</button>}
      </div>
      {children}
    </div>
  );
}
function Row({ children }) {
  return <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, margin: "0 -2px" }}>{children}</div>;
}
function MiniCard({ top, title, sub, accent, onClick }) {
  return (
    <div onClick={onClick} className="pressable" style={{ width: 150, flexShrink: 0, background: "#fff", borderRadius: 16, border: "1.5px solid #efe7d6", padding: 14, cursor: "pointer" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: accent }}>{top}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
    </div>
  );
}
function TipCard({ icon, text }) {
  return (
    <div style={{ width: 160, flexShrink: 0, background: "#fff", borderRadius: 16, border: "1.5px solid #efe7d6", padding: 14 }}>
      <div style={{ marginBottom: 8 }}><Icon name={icon} size={22} color="var(--coral)" /></div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>{text}</div>
    </div>
  );
}
function EmptyRow({ text }) {
  return <div style={{ background: "#fff", borderRadius: 16, border: "1.5px dashed #e0d8c8", padding: "16px 18px", fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{text}</div>;
}
function Skel() {
  return <div style={{ display: "flex", gap: 10 }}>{[0, 1].map((i) => <div key={i} style={{ width: 150, height: 70, borderRadius: 16, background: "#f0e9da" }} />)}</div>;
}

/* ---------------- BUSINESS HOME (search) ---------------- */
function BusinessHome({ me, router }) {
  const p = me.profile;
  const first = (p.company_name || p.full_name || "there").split(" ")[0];
  const isAgency = p.role === "agency";
  const [creators, setCreators] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeNiche, setActiveNiche] = useState("");

  const proActive = (c) => c.is_pro && c.pro_until && new Date(c.pro_until).getTime() > Date.now();

  useEffect(() => { (async () => {
    const { data } = await me.supabase.from("profiles").select("*").eq("role", "creator").eq("onboarding_done", true).order("created_at", { ascending: false });
    const list = (data || []).filter((c) => !c.suspended);
    list.sort((a, b) => (proActive(b) ? 1 : 0) - (proActive(a) ? 1 : 0));
    setCreators(list);
    const { data: dl } = await me.supabase.from("deals").select("*").eq("business_id", p.id).order("updated_at", { ascending: false });
    setDeals(dl || []);
    setLoading(false);
  })(); }, []);

  const searching = q.trim() || activeNiche;
  const filtered = creators.filter((c) => {
    const matchQ = !q || (c.full_name || "").toLowerCase().includes(q.toLowerCase()) || (c.instagram_handle || "").toLowerCase().includes(q.toLowerCase()) || (c.city || "").toLowerCase().includes(q.toLowerCase());
    const matchN = !activeNiche || c.niche === activeNiche;
    return matchQ && matchN;
  });
  const activeDeals = deals.filter((d) => ["pending", "accepted", "in_progress", "delivered"].includes(d.status));

  return (
    <Shell>
      {/* Greeting + active deals chip */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, margin: 0 }}>Hey {first}</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "2px 0 0", lineHeight: 1.1 }}>{isAgency ? "Agency HQ" : "Find creators"}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div onClick={() => router.push("/app/deals")} style={{ background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 18, padding: "8px 14px", textAlign: "right", cursor: "pointer" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Active</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--blue)" }}>{loading ? "…" : activeDeals.length}</div>
          </div>
          <NotificationBell supabase={me.supabase} userId={p.id} />
        </div>
      </div>

      {/* Search */}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creators by name, handle, city…" style={{ width: "100%", padding: "14px 18px", fontSize: 15, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 18, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", marginBottom: 14 }} />

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14, marginLeft: -2 }}>
        <Pill label="All" active={!activeNiche} onClick={() => setActiveNiche("")} />
        {NICHES.map((n) => <Pill key={n} label={n} active={activeNiche === n} onClick={() => setActiveNiche(activeNiche === n ? "" : n)} />)}
      </div>

      {/* If searching, show results grid. Otherwise show dashboard sections. */}
      {searching ? (
        loading ? <p style={{ color: "var(--muted)", fontWeight: 600, textAlign: "center", marginTop: 30 }}>Loading…</p>
        : filtered.length === 0 ? <EmptyCreators hasAny={creators.length > 0} />
        : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
            {filtered.map((c) => <CreatorCard key={c.id} c={c} onClick={() => router.push("/app/creator/" + c.id)} />)}
          </div>
      ) : (
        <>
          {/* Featured / top creators */}
          <Section title="Top creators" onAll={creators.length ? () => setActiveNiche("") : null}>
            {loading ? <Skel /> : creators.length === 0 ? (
              <EmptyRow text="No creators have joined yet. Check back soon!" />
            ) : (
              <Row>
                {creators.slice(0, 8).map((c) => {
                  const colors = ["var(--coral)", "var(--blue)", "var(--pink)", "var(--yellow)", "var(--green)"];
                  const col = colors[(c.full_name || "x").charCodeAt(0) % colors.length];
                  const initials = (c.full_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <div key={c.id} onClick={() => router.push("/app/creator/" + c.id)} className="pressable" style={{ width: 130, flexShrink: 0, background: "#fff", borderRadius: 16, border: proActive(c) ? "2px solid var(--yellow)" : "1.5px solid #efe7d6", padding: 12, cursor: "pointer" }}>
                      <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 12, background: col, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{initials}</span>
                        {proActive(c) && <span style={{ position: "absolute", top: 6, left: 6, background: "var(--yellow)", borderRadius: 8, padding: "2px 5px", display: "flex", alignItems: "center" }}><Icon name="star" size={11} color="#412402" fill="#412402" strokeWidth={1} /></span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.full_name}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.niche}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)", marginTop: 2 }}>{inr(c.rate_per_post)}</div>
                    </div>
                  );
                })}
              </Row>
            )}
          </Section>

          {/* Browse by niche */}
          <Section title="Browse by niche">
            <Row>
              {NICHES.map((n) => (
                <div key={n} onClick={() => setActiveNiche(n)} className="pressable" style={{ flexShrink: 0, background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 14, padding: "14px 18px", fontSize: 14, fontWeight: 800, color: "var(--ink)", cursor: "pointer" }}>{n}</div>
              ))}
            </Row>
          </Section>

          {/* Your active deals */}
          <Section title="Your active deals" count={activeDeals.length} onAll={activeDeals.length ? () => router.push("/app/deals") : null}>
            {loading ? <Skel /> : activeDeals.length === 0 ? (
              <EmptyRow text="No active deals. Find a creator and send an offer!" />
            ) : (
              <Row>
                {activeDeals.map((d) => (
                  <MiniCard key={d.id} onClick={() => router.push("/app/chat/" + d.id)} accent="var(--blue)"
                    top={inr(d.amount)} title={d.title} sub={(d.status || "").replace("_", " ")} />
                ))}
              </Row>
            )}
          </Section>

          {/* Tips */}
          <Section title={isAgency ? "Agency tips" : "Tips"}>
            <Row>
              <TipCard icon="search" text="Filter by niche to find the right creator fast." />
              <TipCard icon="film" text="Watch their reels before sending an offer." />
              <TipCard icon="check" text="Verified creators show real follower counts." />
              <TipCard icon="wallet" text="Payment is held safely until you approve the work." />
            </Row>
          </Section>
        </>
      )}
    </Shell>
  );
}

function CreatorCard({ c, onClick }) {
  const colors = ["var(--coral)", "var(--blue)", "var(--pink)", "var(--yellow)", "var(--green)"];
  const col = colors[(c.full_name || "x").charCodeAt(0) % colors.length];
  const initials = (c.full_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const proActive = c.is_pro && c.pro_until && new Date(c.pro_until).getTime() > Date.now();
  return (
    <div onClick={onClick} className="pressable" style={{ background: "#fff", borderRadius: 20, padding: 14, border: proActive ? "2px solid var(--yellow)" : "1.5px solid #efe7d6", cursor: "pointer" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 14, background: col, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: "#fff" }}>{initials}</span>
        {proActive && <span style={{ position: "absolute", top: 8, left: 8, background: "var(--yellow)", borderRadius: 10, padding: "3px 8px", display: "flex", alignItems: "center", gap: 3 }}><Icon name="star" size={11} color="#412402" fill="#412402" strokeWidth={1} /><span style={{ fontSize: 10, fontWeight: 800, color: "#412402" }}>PRO</span></span>}
        {c.instagram_connected && <span style={{ position: "absolute", top: 8, right: 8, background: "#fff", borderRadius: 12, padding: "3px 7px", display: "flex", alignItems: "center" }}><Icon name="check" size={12} color="#173404" strokeWidth={3} /></span>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.full_name}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>{c.niche} · {c.city}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--coral)" }}>{inr(c.rate_per_post)}<span style={{ color: "var(--faint)", fontWeight: 600 }}>/post</span></div>
    </div>
  );
}

function EmptyCreators({ hasAny }) {
  return (
    <div style={{ textAlign: "center", marginTop: 36 }}>
      <div style={{ marginBottom: 12 }}><Panda size={72} style={{ margin: "0 auto", display: "block" }} /></div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{hasAny ? "No matches" : "No creators yet"}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>{hasAny ? "Try a different filter." : "As creators join HypePanda, they'll appear here."}</div>
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700, border: active ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: active ? "var(--ink)" : "#fff", color: active ? "#fff" : "var(--ink)" }}>{label}</button>
  );
}


function Stat({ big, small }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 20, padding: 18, border: "1.5px solid #efe7d6" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{big}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{small}</div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ height: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px", overflowY: "auto" }}>{children}</div>
      <TabBar />
    </div>
  );
}
