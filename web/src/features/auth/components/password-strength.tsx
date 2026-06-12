import { cn } from "@/lib/utils"

function getStrength(password: string): {
	score: number
	label: string
	color: string
} {
	if (!password) return { score: 0, label: "", color: "" }
	let score = 0
	if (password.length >= 8) score++
	if (password.length >= 12) score++
	if (/[A-Z]/.test(password)) score++
	if (/[0-9]/.test(password)) score++
	if (/[^A-Za-z0-9]/.test(password)) score++

	if (score <= 1) return { score, label: "Weak", color: "bg-red-500" }
	if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" }
	if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" }
	return { score, label: "Strong", color: "bg-green-500" }
}

export function PasswordStrength({ password }: { password: string }) {
	const { score, label, color } = getStrength(password)
	if (!password) return null

	return (
		<div className="space-y-1">
			<div className="flex gap-1 h-1">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className={cn(
							"h-full flex-1 rounded-full transition-colors",
							i <= score ? color : "bg-muted"
						)}
					/>
				))}
			</div>
			<p className="text-xs text-muted-foreground">{label}</p>
		</div>
	)
}
