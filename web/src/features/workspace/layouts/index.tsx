import { ResizablePanelGroup } from "@/components/ui/resizable"

export function WorkspaceLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex min-h-svh w-full">
			<div className="flex flex-col h-screen w-screen">
				<div className="flex flex-col">
					<div className="shrink-0">
						{/* //#region - Banner for Errors */}
						{/* {noErrors && <AlertBannerError />} */}
						{/* //#endregion - Banner for Errors */}

						{/* //#region - Banner for Warnings */}
						{/* {noWarnings && <AlertBannerWarning />} */}
						{/* //#endregion - Banner for Warnings */}

						{/* //#region - Banner for Info */}
						{/* {noInfos && <AlertBannerInfo />} */}
						{/* //#endregion - Banner for Info */}
					</div>
				</div>
				<div className="shrink-0">
					{/* //#region - Mobile responsive header */}

					{/* //#endregion - Mobile responsive header */}

					{/* //#region - Desktop header */}

					{/* //#endregion - Desktop header */}
				</div>
				<div className="flex flex-1 w-full overflow-y-hidden">
					{/* //#region - Sidebar */}
					{/* //#endregion - Sidebar */}
					<ResizablePanelGroup>{children}</ResizablePanelGroup>
				</div>
			</div>
		</div>
	)
}
