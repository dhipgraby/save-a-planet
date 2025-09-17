import { Separator } from "@/components/ui/separator";

interface FormTitleProps {
    title: string;
    description?: string;
}

const FormTitle = ({
  title,
  description
}: FormTitleProps) => {

  return (
    <>
      <div className="ta-c mb-10">
        <h1 className="text-2xl font-semibold">
          {title}
        </h1>
        {description && (
          <p className="text-xs font-semibold max-w-sm">
            {description}
          </p>
        )}
      </div>
      <Separator className="mb-5" />
    </>
  );

};

export default FormTitle;