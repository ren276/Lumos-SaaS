"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import useRefetch from "~/hooks/use-refetch";
import { api } from "~/trpc/react";


type FormInput = {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
};
const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const createProject = api.project.createProject.useMutation()
  const refetch = useRefetch()
  function onSubmit(data: FormInput) {
    createProject.mutate({
        githubUrl:data.repoUrl,
        name:data.projectName,
        githubToken: data.githubToken,
    },{
        onSuccess: () => {
            toast.success('Project created successfully')
            refetch()
            reset()
        },
        onError: () => {
            toast.error('Failed to create project')
        }
    })
    return true;
  }
  return (
    <div className="flex h-full items-center justify-center gap-12">
      <img
        src="/undraw_github.svg"
        className="h-56 w-auto"
        alt="github image"
      ></img>
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link Your Github Repository
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter the URL of your repository to link it to Lumos
          </p>
        </div>
        <div className="h-4"></div>
        <div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register("projectName" , { required: true })}
              placeholder="Project Name"
              required
            />
            <div className="h-2"></div>
            <Input
              {...register("repoUrl" ,{ required: true })}
              placeholder="Github URL"
              type="url"
              required
            />
            <div className="h-2"></div>
            <Input
              {...register("githubToken")}
              placeholder="GitHub Token (Optional)"
            />
            <div className="h-2"></div>
            <Button type="submit" disabled= {createProject.isPending}>Create Project</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
