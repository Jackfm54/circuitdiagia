import { cloud } from "./cloud";
import type { DiagnosticData } from "@/components/DiagnosticResult";
import type { MeasurementData } from "@/lib/serialMeasurement";
export interface SavedReport { id: string; title: string; report_number: string; language: string; result: DiagnosticData; measurements: MeasurementData[]; image_path: string | null; created_at: string; }
export async function saveReport(result: DiagnosticData, measurements: MeasurementData[], image: string | null, language: string, reportNumber: string) {
  const { data: { user } } = await cloud.auth.getUser();
  if (!user) throw new Error("Session expired");
  let image_path: string | null = null;
  if (image) {
    const blob = await (await fetch(image)).blob();
    image_path = `${user.id}/${crypto.randomUUID()}.${blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg"}`;
    const { error } = await cloud.storage.from("diagnostic-images").upload(image_path, blob, { contentType: blob.type });
    if (error) throw error;
  }
  const { data, error } = await cloud.from("diagnostics").insert({ user_id: user.id, report_number: reportNumber, title: result.summary.slice(0,100), language, result, measurements, image_path }).select().single();
  if (error) { if (image_path) await cloud.storage.from("diagnostic-images").remove([image_path]); throw error; }
  return data as SavedReport;
}
export async function imageUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await cloud.storage.from("diagnostic-images").createSignedUrl(path,3600);
  if (error) throw error; return data.signedUrl;
}
