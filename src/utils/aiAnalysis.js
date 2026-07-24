/**
 * IMPORTANT: Never call the Gemini API directly from the browser — that
 * would expose your API key to anyone who opens devtools. Instead, this
 * calls YOUR OWN backend endpoint, which holds the Gemini key server-side
 * and forwards the request.
 *
 * Suggested backend responsibilities (build this separately, e.g. a small
 * Flask/Node/Firebase Cloud Function):
 *   1. Receive { ecgWindow, gsr, heartRate } from the frontend
 *   2. Optionally run your PyTorch model first for the Normal/Warning/
 *      High Risk classification + arrhythmia screening
 *   3. Optionally send the PyTorch output + raw features to Gemini to
 *      generate a plain-language explanation/summary for the user
 *   4. Return a combined JSON result to the frontend
 *
 * Example backend contract this function expects back:
 *   {
 *     status: "Normal" | "Warning" | "High Risk",
 *     abnormalities: string[],        // e.g. ["Possible atrial fibrillation"]
 *     stressLevel: "Low" | "Moderate" | "High",
 *     summary: string,                // Gemini-generated plain-language note
 *     recommendSeekCare: boolean
 *   }
 */

const ANALYSIS_ENDPOINT = import.meta.env.VITE_ANALYSIS_API_URL || '/api/analyze';

export async function requestHealthAssessment({ ecgWindow, gsr, heartRate }) {
  const res = await fetch(ANALYSIS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ecgWindow, gsr, heartRate }),
  });

  if (!res.ok) {
    throw new Error(`Analysis request failed: ${res.status}`);
  }

  return res.json();
}
