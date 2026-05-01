import { SidebarTrigger } from "@/components/ui/sidebar"
import { AppLayout } from "../components/app-layout"

const AppDashboardPage = () => {
	return (
		<AppLayout>
			<div>
				<SidebarTrigger />
			</div>
		</AppLayout>
	)
}

export { AppDashboardPage }
