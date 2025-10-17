"use client";

import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "@/components/other/tags";
import { useEffect, useState } from "react";

import { CheckIcon } from "lucide-react";

interface Props {
  tags: { id: string; label: string }[];
  onValueChange: (change: string[]) => void;
}

export default function TagField(props: Props) {
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [, setSearch] = useState<string | null>(null);

  const getKey = function (value: string) {
    return props.tags.find((tag) => tag.label === value)?.id;
  };
  const handleRemove = function (value: string) {
    setSelected((map) => {
      const newMap = new Map(map);
      newMap.delete(value);
      return newMap;
    });
  };
  const handleSelect = function (value: string) {
    setSelected((map) => {
      const key = getKey(value);
      if (!key) return map;
      const newMap = new Map(map);
      newMap.set(value, key);
      return newMap;
    });
    setSearch(null);
  };

  useEffect(
    function () {
      props.onValueChange(Array.from(selected.values()));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected],
  );

  return (
    <Tags>
      <TagsTrigger>
        {Array.from(selected.keys()).map((tag) => (
          <TagsValue
            className="capitalize"
            key={tag}
            onRemove={() => handleRemove(tag)}
          >
            {tag}
          </TagsValue>
        ))}
      </TagsTrigger>
      <TagsContent>
        <TagsInput onValueChange={setSearch} placeholder="Search a tag..." />
        <TagsList>
          <TagsEmpty />
          <TagsGroup>
            {props.tags.map((tag) => (
              <TagsItem
                key={tag.id}
                className="capitalize"
                onSelect={handleSelect}
                value={tag.label}
              >
                {tag.label}
                {selected.has(tag.id) && (
                  <CheckIcon className="text-muted-foreground h-4 w-4" />
                )}
              </TagsItem>
            ))}
          </TagsGroup>
        </TagsList>
      </TagsContent>
    </Tags>
  );
}
