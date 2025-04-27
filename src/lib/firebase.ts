/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ialcclirpwmrvuaadxth.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbGNjbGlycHdtcnZ1YWFkeHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NDIzMDcsImV4cCI6MjA2MTMxODMwN30.jkVg5KgoONrPyEK-bg-bTUmbGssX7Col4rPdN4-0Lug";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFile(
  file: File,
  setProgress?: (progress: number) => void,
) {
  return new Promise(async (resolve, reject) => {
    try {
      let progressInterval: NodeJS.Timeout | null = null;
      if (setProgress) {
        let simulatedProgress = 0;
        setProgress(0); // Start at 0%

        // Simulate progress up to 90% (save the last 10% for actual completion)
        progressInterval = setInterval(() => {
          // Increment slower as we get closer to 90%
          const increment = Math.max(1, 10 * (1 - simulatedProgress / 90));
          simulatedProgress = Math.min(89, simulatedProgress + increment);
          setProgress(Math.floor(simulatedProgress));
        }, 300);
      }
      // Create a virtual storage path, not a real device path
      const filePath = `audios/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("meeting") // your Supabase bucket name
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "audio/mpeg",
        });

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (error) {
        console.error("Upload error:", error);
        reject(error);
      } else {
        if (setProgress) setProgress(100); // upload done
        const { data: publicData } = supabase.storage
          .from("meeting")
          .getPublicUrl(filePath);

        resolve(publicData.publicUrl as string);
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}
