import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AppProviders } from "@/providers"
import "@/globals.css"

if (import.meta.env.DEV || import.meta.env.MODE === "test") {
	import("react-scan").then(({ scan }) => {
		scan()
	})

	import("react-grab")
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<AppProviders />
	</StrictMode>
)
