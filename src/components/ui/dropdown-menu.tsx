import * as React from "react";
import { cn } from "../../lib/utils";

interface DropdownMenuProps {
  readonly children: React.ReactNode;
}

const DropdownMenu = ({ children }: DropdownMenuProps): React.JSX.Element => {
  return <div className="relative inline-block">{children}</div>;
};

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly align?: 'start' | 'end';
}

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, children, align = "end", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-[100] min-w-[12rem] overflow-hidden rounded-md border border-border bg-card p-1 text-card-foreground shadow-lg backdrop-blur-sm",
        align === "end" ? "right-0" : "left-0",
        "mt-2",
        className
      )}
      style={{ backgroundColor: "hsl(var(--card))" }}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

interface DropdownMenuCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly checked?: boolean;
}

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
});
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};

