"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StudyCard, StudyData } from "./study-card";

interface SortableStudyCardProps {
  study: StudyData;
}

export function SortableStudyCard({ study }: SortableStudyCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: study.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <StudyCard study={study} isDragging={isDragging} />
    </div>
  );
}