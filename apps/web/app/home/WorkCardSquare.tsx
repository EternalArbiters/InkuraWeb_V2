import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";

export default function WorkCardSquare({ work }: { work: any }) {
  return <InteractiveWorkCard work={work} className="snap-start shrink-0 w-[160px] sm:w-[190px]" />;
}
