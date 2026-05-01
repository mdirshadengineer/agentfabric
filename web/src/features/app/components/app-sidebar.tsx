import { AudioWaveform, Command, GalleryVerticalEnd } from "lucide-react"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarProvider,
} from "@/components/ui/sidebar"
import { NavUser } from "./app-user"
import { AppWorkspaceSwitcher } from "./app-workspace-switcher"

/**
 * The `AppSidebarProvider` component in TypeScript React sets custom CSS variables for sidebar width
 * and header height within a `SidebarProvider` component.
 * @param  - The `AppSidebarProvider` component is a React functional component that takes a `children`
 * prop of type `React.ReactNode`. It wraps its children with a `SidebarProvider` component and sets
 * some custom CSS variables using the `style` prop.
 * @returns The `AppSidebarProvider` function is being returned. It takes a `children` prop of type
 * `React.ReactNode` and wraps the children with a `SidebarProvider` component. The `SidebarProvider`
 * component has inline styles defined for `--sidebar-width` and `--header-height` using CSS variables.
 */
export function AppSidebarProvider({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			{children}
		</SidebarProvider>
	)
}

// AppSidebar
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<AppWorkspaceSwitcher
					workspaces={[
						{
							name: "Acme Inc",
							logo: GalleryVerticalEnd,
							plan: "Enterprise",
						},
						{
							name: "Acme Corp.",
							logo: AudioWaveform,
							plan: "Startup",
						},
						{
							name: "Evil Corp.",
							logo: Command,
							plan: "Free",
						},
					]}
				/>
			</SidebarHeader>
			<SidebarContent></SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{
						name: "mdirshadengineer",
						email: "mdirshadengineer+github@gmail.com",
						avatar:
							"https://avatars.githubusercontent.com/u/191547746?v=4&size=64",
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	)
}
