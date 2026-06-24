"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CategoryType } from "@/lib/types";

interface CategoryFormProps {
  onSubmit: (data: {
    name: string;
    type: CategoryType;
    color: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function CategoryForm({
  onSubmit,
  onCancel,
  loading,
}: CategoryFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      name: name.trim(),
      type,
      color,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="categoryName">Category Name</Label>
        <Input
          id="categoryName"
          placeholder="e.g. Gym Membership"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={type}
          onValueChange={(v) => v && setType(v as CategoryType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                color === c
                  ? "border-foreground scale-110"
                  : "border-transparent"
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? "Creating..." : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
