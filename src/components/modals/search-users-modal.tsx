"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { useModal } from "@/hooks/use-modal-store";

type SearchUser = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  members: {
    id: string;
    serverId: string;
    server: { id: string; name: string };
  }[];
};

export const SearchUsersModal = () => {
  const { isOpen, onClose, type } = useModal();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  const isModalOpen = isOpen && type === "searchUsers";

  const handleSearch = (value: string) => {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/users/search?q=${encodeURIComponent(value)}`
        );
        setResults(response.data);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);
  };

  const handleClose = () => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setQuery("");
    setResults([]);
    onClose();
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [isModalOpen]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900/95 text-white p-0 overflow-hidden max-w-md border border-zinc-800 backdrop-blur-xl">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold text-zinc-100">
            Find friends
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Search for members in your shared servers
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              ref={inputRef}
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-zinc-700/75 border-none"
            />
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Tip: <span className="font-semibold">Ctrl/Cmd + K</span> anytime • results open in Direct Messages
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto px-6 pb-6 space-y-2">
          {isLoading && (
            <p className="text-sm text-zinc-500 text-center py-4">Searching...</p>
          )}
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">
              No members found. They must share a server with you.
            </p>
          )}
          {results.map((user) => {
            const member = user.members[0];
            if (!member) return null;

            return (
              <Link
                key={user.id}
                href={`/dms/${member.id}`}
                onClick={handleClose}
                className="flex items-center gap-3 p-3 rounded-md hover:bg-zinc-700/50 transition"
              >
                <UserAvatar src={user.imageUrl || ""} name={user.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {member.server.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
