import { Link } from "@tanstack/react-router"

export function WorkspaceDesktopHeader() {
	return (
		<header className="hidden md:flex h-11 md:h-12 items-center shrink-0 border-b">
			<div className="flex items-center justify-between h-full pr-3 flex-1 overflow-x-auto gap-x-8 pl-4">
				{/* //#region - Show this when no workspace is selected and we are in /workspaces route */}
				{/* //#endregion - Show this when no workspace is selected and we are in /workspaces route */}

				{/* //#region - Show this when a workspace is selected */}
				<div className="hidden md:flex items-center text-sm">
					<Link to="/" className="items-center justify-center shrink-0 flex">
						<img src="/agentflow.png" alt="AgentFabric" className="h-4.5" />
					</Link>
					<div className="flex items-center md:pl-2">
						{/* //#region - Separator */}
						<span className="text-border-stronger pr-2 hidden md:block">
							<svg
								viewBox="0 0 24 24"
								width="16"
								height="16"
								stroke="currentColor"
								strokeWidth="1"
								strokeLinecap="round"
								strokeLinejoin="round"
								fill="none"
								shapeRendering="geometricPrecision"
								aria-hidden="true"
							>
								<path d="M16 3.549L7.12 20.600"></path>
							</svg>
						</span>
						{/* //#endregion - Separator */}

						<div className="flex items-center shrink-0">
							{/* //#region - Show current page name when workspace is selected */}
							<span className="text-sm text-foreground">Organizations</span>
							{/* //#endregion - Show current page name when workspace is selected */}
						</div>
					</div>
				</div>
				{/* //#endregion - Show this when a workspace is selected */}

				{/* //#region - Show Feedback, Search, Help, Advisor & profile */}
				<div className="flex items-center gap-x-2">
					{/* Feedback */}
					{/* <Button variant="outline" size={"sm"}>
						<span>Feedback</span>
					</Button> */}

					{/* Search */}
					{/* <AgentFabricGlobalSearch /> */}

					{/* Help */}
					{/* <Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size={"icon"}>
											<span className="rounded-full">
												<IconHelpCircle />
											</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<span>Help</span>
									</TooltipContent>
								</Tooltip> */}

					{/* Advisor */}
					{/* <Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size={"icon"}>
											<span className="rounded-full">
												<IconBulb />
											</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<span>Advisor</span>
									</TooltipContent>
								</Tooltip> */}

					{/* Profile */}
					{/* <Button variant="ghost" size={"icon"}>
									<span className="rounded-full">
										<Avatar className="size-6">
											<AvatarImage
												src="https://avatars.githubusercontent.com/u/191547746?v=4&size=64"
												alt="Md Irshad"
											/>
											<AvatarFallback className="rounded-lg">
												<IconUser />
											</AvatarFallback>
										</Avatar>
									</span>
								</Button> */}
				</div>
				{/* //#endregion - Show Feedback, Search, Help, Advisor & profile */}
			</div>
		</header>
	)
}
