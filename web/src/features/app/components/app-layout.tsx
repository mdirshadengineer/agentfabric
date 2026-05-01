import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar, AppSidebarProvider } from "./app-sidebar"

const AppLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	return (
		<AppSidebarProvider>
			<AppSidebar collapsible="offcanvas" variant="inset" />
			<SidebarInset>{children}</SidebarInset>
		</AppSidebarProvider>
	)
}

export { AppLayout }
