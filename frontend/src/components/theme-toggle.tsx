import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip.tsx";
import { useThemeStore } from "#/stores/theme.ts";

export function ThemeToggle() {
	const theme = useThemeStore((state) => state.theme);
	const toggleTheme = useThemeStore((state) => state.toggleTheme);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const label =
		theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					aria-label={label}
					onClick={toggleTheme}
					size="icon"
					variant="ghost"
				>
					{mounted && theme === "dark" ? (
						<Sun className="size-5" />
					) : (
						<Moon className="size-5" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}
