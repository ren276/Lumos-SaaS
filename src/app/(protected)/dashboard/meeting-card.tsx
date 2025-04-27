"use client";

import React from "react";
import { Card } from "~/components/ui/card";
import { useDropzone } from "react-dropzone";
import { uploadFile } from "~/lib/firebase";
import { Presentation, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { api } from "~/trpc/react";
import useProject from "~/hooks/use-project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

const MeetingCard = () => {
  const { project } = useProject();
  const processMeeting = useMutation({mutationFn: async (data :{meetingUrl: string, meetingId: string, projectId: string}) => {
    const { meetingUrl, meetingId, projectId } = data;
    const response = await axios.post("/api/process-meeting", {meetingUrl, meetingId, projectId});
    return response.data;
  }});
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const router = useRouter();
  const uploadMeeting = api.project.uploadMeeting.useMutation();
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    multiple: false,
    maxSize: 50_000_000,
    onDrop: async (acceptedFiles) => {
      if (!project) return;
      setIsUploading(true);
      console.log(acceptedFiles);
      const file = acceptedFiles[0];
      if(!file) return
      const downloadUrl = await uploadFile(file as File, setProgress) as string;
      uploadMeeting.mutate({
        projectId: project.id,
        meetingUrl: downloadUrl,
        name: file.name,
      }, {
        onSuccess: (meeting) => {
            toast.success("Meeting uploaded successfully!");
            router.push("/meetings")
            processMeeting.mutateAsync({meetingUrl: downloadUrl, meetingId: meeting.id, projectId: project.id}, {})
        },
        onError: (error) => {
          toast.error("Error uploading meeting: " + error.message);
        },
      });
      setIsUploading(false);
    },
  });
  return (
    <Card
      className="col-span-2 flex flex-col items-center justify-center p-10"
      {...getRootProps()}
    >
      {!isUploading && (
        <>
          <Presentation className="h-10 w-10 animate-bounce" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Create a new meeting
          </h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Analyse your meeting with Lumos
            <br />
            Powered by AI
          </p>
          <div className="mt-6">
            <Button disabled={isUploading}>
              <Upload
                className="mr-1.5 -ml-0.5 h-5 w-5"
                aria-hidden="true"
              ></Upload>
              Upload Meeting
              <input className="hidden" {...getInputProps()}></input>
            </Button>
          </div>
        </>
      )}
      {isUploading && (
        <div>
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            className="size-20"
            styles={buildStyles({
              pathColor: "#4f46e5",
              textColor: "#4f46e5",
            })}
          />
          <p className="mt-2 text-sm font-semibold text-gray-900">
            Uploading your meeting...
          </p>
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
