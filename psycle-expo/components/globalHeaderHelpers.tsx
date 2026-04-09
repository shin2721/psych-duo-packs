import React from "react";
import i18n from "../lib/i18n";
import { MentalIcon, MoneyIcon, WorkIcon, HealthIcon, SocialIcon, StudyIcon } from "./CustomIcons";

export const getGenreIcon = (id: string, size: number = 28) => {
  switch (id) {
    case "mental":
      return <MentalIcon size={size} />;
    case "money":
      return <MoneyIcon size={size} />;
    case "work":
      return <WorkIcon size={size} />;
    case "health":
      return <HealthIcon size={size} />;
    case "social":
      return <SocialIcon size={size} />;
    case "study":
      return <StudyIcon size={size} />;
    default:
      return <MentalIcon size={size} />;
  }
};

export const getGenreLabel = (id: string, fallback: string) => {
  const key = `onboarding.genres.${id}`;
  const translated = i18n.t(key);
  return translated === key ? fallback : translated;
};
