interface IRateTagProps {
  value: string | number;
}

export default function RateTag({ value }: IRateTagProps) {
  return (
    <span className="px-2 py-1 border border-solid border-brandDisable bg-brandBg rounded-md text-sm text-brandDefault">
      {value}%
    </span>
  );
}
