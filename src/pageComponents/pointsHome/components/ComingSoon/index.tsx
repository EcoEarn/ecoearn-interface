interface IComingSoonProps {
  name: string;
  desc: string;
}

const ComingSoon = ({ name, desc }: IComingSoonProps) => {
  return (
    <>
      <div className="w-full border border-solid border-neutralDivider rounded-xl py-[32px] lg:py-[64px]  text-center">
        <div className="text-[20px] font-[600] mb-[16px]">{name}</div>
        <div className="text-[14px] max-w-[60%] m-auto text-neutralTertiary">{desc}</div>
      </div>
    </>
  );
};

export default ComingSoon;
