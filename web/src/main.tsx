import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AppProviders } from "@/providers"
import "@/globals.css"

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<AppProviders />
	</StrictMode>
)
