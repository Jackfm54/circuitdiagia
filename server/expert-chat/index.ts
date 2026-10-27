export async function handler(req: Request) {
  try {
    const { messages, language = "fr", mode } = await req.json();
    if (!Array.isArray(messages) || messages.length > 60 || messages.some(m => !["user", "assistant"].includes(m?.role) || typeof m.content !== "string" || m.content.length > 20000 || (m.image && !/^data:image\/(jpeg|png|webp);base64,/.test(m.image)))) return Response.json({ error: "Invalid messages" }, { status: 400 });
    if (mode === "generate_diagram") {
      const image = messages.at(-1)?.image;
      if (!image) return Response.json({ error: "Image required" }, { status: 400 });
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1", input: [{ role: "user", content: [{ type: "input_text", text: `Generate a professional standard-symbol schematic from this PCB image. Clearly label it INFERRED, not an original schematic. Do not invent unreadable part values. Reply in ${language === "en" ? "English" : "French"}.` }, { type: "input_image", image_url: image }] }], tools: [{ type: "image_generation" }] }),
      });
      if (!response.ok) return Response.json({ error: "OpenAI image generation unavailable" }, { status: response.status });
      const data = await response.json();
      const output = data.output?.find((item: { type: string }) => item.type === "image_generation_call");
      if (!output?.result) return Response.json({ error: "No diagram returned" }, { status: 502 });
      return Response.json({ diagram: `data:image/png;base64,${output.result}`, description: language === "en" ? "Inferred schematic — verify all connections by measurement." : "Schéma déduit — vérifier toutes les connexions par mesure." });
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1", messages: [{ role: "system", content: `You are an electronics engineering AI assistant. Prioritize safety. Distinguish visual suspicions from electrically confirmed faults. Never promise perfect detection. Nano measures DC voltage only, not continuity or resistance. Never suggest connecting unknown rails, mains or negative voltage to Arduino. Resistance, diode and continuity tests require all power disconnected and capacitors safely discharged. Ask for mapped test points and multimeter readings. Do not claim personal real-world experience. Reply in ${language === "en" ? "English" : "French"}.` }, ...messages.map(m => ({ role: m.role, content: m.image ? [{ type: "text", text: m.content || "Inspect this PCB" }, { type: "image_url", image_url: { url: m.image } }] : m.content }))], stream: true }),
    });
    if (!response.ok) return Response.json({ error: "OpenAI request failed" }, { status: response.status });
    return new Response(response.body, { headers: { "Content-Type": "text/event-stream" } });
  } catch { return Response.json({ error: "Assistant unavailable" }, { status: 502 }); }
}
