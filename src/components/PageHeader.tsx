interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
