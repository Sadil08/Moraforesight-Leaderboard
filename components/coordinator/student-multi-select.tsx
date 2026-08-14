"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Student = { id: string; name: string; teamName: string };

export function StudentMultiSelect({ students, name }: { students: Student[]; name: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student[]>([]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = students.filter((s) => !selectedIds.has(s.id));
    const matches = q ? available.filter((s) => s.name.toLowerCase().includes(q)) : available;
    return matches.slice(0, 30);
  }, [students, query, selectedIds]);

  function add(student: Student) {
    setSelected((prev) => [...prev, student]);
    setQuery("");
  }

  function remove(id: string) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((student) => (
            <Badge key={student.id} variant="secondary" className="gap-1 pr-1">
              {student.name}
              <button
                type="button"
                onClick={() => remove(student.id)}
                aria-label={`Remove ${student.name}`}
                className="rounded-full hover:bg-black/10"
              >
                <X className="size-3" />
              </button>
              <input type="hidden" name={name} value={student.id} />
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search students by name…"
        aria-label="Search students"
      />
      <div className="max-h-48 overflow-y-auto rounded-lg border">
        {results.length > 0 ? (
          results.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => add(student)}
              className="hover:bg-muted flex w-full items-center justify-between px-3 py-2 text-left text-sm"
            >
              <span>{student.name}</span>
              <span className="text-muted-foreground text-xs">{student.teamName}</span>
            </button>
          ))
        ) : (
          <p className="text-muted-foreground px-3 py-2 text-sm">No matches.</p>
        )}
      </div>
    </div>
  );
}
