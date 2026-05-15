import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

function ShadcnProviders({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<Toaster richColors />
			{children}
		</TooltipProvider>
	)
}

export { ShadcnProviders }
