"use client";

import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  bio: z.string().max(2000).optional(),
  status: z.enum(["ONLINE", "IDLE", "BUSY", "OFFLINE"]),
  statusText: z.string().max(120).optional(),
});

interface ProfileFormProps {
  user: User;
}

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      imageUrl: user.imageUrl || "",
      bannerUrl: user.bannerUrl || "",
      bio: user.bio || "",
      status: user.status,
      statusText: user.statusText || "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch("/api/profile", values);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Edit profile</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Changes apply instantly across servers.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Display name</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="Your name"
                  {...field}
                  className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Presence</FormLabel>
              <FormControl>
                <select
                  {...field}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-0"
                >
                  <option value="ONLINE">Online</option>
                  <option value="IDLE">Idle</option>
                  <option value="BUSY">Busy</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </FormControl>
              <p className="text-[11px] text-zinc-500">
                Tip: offline is meant for when you leave the site.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="statusText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Custom status</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="In a meeting, playing, etc."
                  {...field}
                  className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Avatar URL</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="https://..."
                  {...field}
                  className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                />
              </FormControl>
              <p className="text-[11px] text-zinc-500">
                Use a direct image URL (png/jpg/webp).
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bannerUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Banner URL</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="https://... (profile banner)"
                  {...field}
                  className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Bio (Markdown supported)</FormLabel>
              <FormControl>
                <textarea
                  disabled={isLoading}
                  placeholder="Write your bio with Markdown, e.g. **bold**, *italic*, - list"
                  rows={5}
                  className="flex w-full rounded-md border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-0"
                  {...field}
                />
              </FormControl>
              <p className="text-[11px] text-zinc-500">
                Markdown is officially supported in profile bio.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-1">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-500 hover:bg-indigo-600"
          >
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
};
