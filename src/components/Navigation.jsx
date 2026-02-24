import { useEffect, useId } from "react";
import { useNavigate } from "react-router";
import {
	Share2,
	Palette,
	PlusCircle,
	Hammer,
	Package as PackageIcon,
	Settings,
	Server,
	ChevronLeft,
	ChevronRight
} from "lucide-react";

function Navigation({ active, working, collapsed, onToggle }) {
	const history = useNavigate();

	const links = [
		{
			text: "Exporter",
			id: "exporter",
			link: "/exporter",
			icon: Share2,
			key: "e"
		},
		{
			text: "Theme",
			id: "theme",
			link: "/theme",
			icon: Palette,
			key: "t"
		},
		{
			text: "Creator",
			id: "creator",
			link: "/creator",
			icon: PlusCircle,
			key: "c"
		},
		{
			text: "Builder",
			id: "builder",
			link: "/builder",
			icon: Hammer,
			key: "b"
		},
		{
			text: "Package",
			id: "package",
			link: "/package",
			icon: PackageIcon,
			key: "p"
		},
		{
			text: "Sysmin",
			id: "sysmin",
			link: "/sysmin",
			icon: Settings,
			key: "s"
		},
		{
			text: "Server",
			id: "server",
			link: "/server",
			icon: Server,
			key: "g"
		}
	];

	function onLinkClick(path) {
		if (working) return;
		history(path);
	}

	function handleMenuKeyDown(e) {
		if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
		
		e.preventDefault();
		const items = Array.from(e.currentTarget.querySelectorAll('.sidebar-header, .menu-item'));
		const currentIndex = items.indexOf(document.activeElement);
		
		let nextIndex;
		if (e.key === "ArrowDown") {
			nextIndex = (currentIndex + 1) % items.length;
		} else {
			nextIndex = (currentIndex - 1 + items.length) % items.length;
		}
		
		items[nextIndex]?.focus();
	}

	function handleMenuFocus(e) {
		const relatedTarget = e.relatedTarget;
		if (!relatedTarget) return;

		// Check if the focus is entering the menu from outside
		if (e.currentTarget.contains(relatedTarget)) return;

		// Check if coming from main content but NOT from a toolbar
		const isFromMain = relatedTarget.closest('main');
		const isFromToolbar = relatedTarget.closest('.toolbar');

		if (isFromMain && !isFromToolbar) {
			const selectedItem = e.currentTarget.querySelector('.menu-item.selected');
			if (selectedItem) {
				// Use a small timeout to ensure the focus completes before we redirect
				setTimeout(() => {
					selectedItem.focus();
				}, 0);
			}
		}
	}

	function getLinkClass(id) {
		let classes = ["menu-item"];
		if (id === active) classes.push("selected");
		if (working) classes.push("disabled");
		return classes.join(" ");
	}

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.altKey) {
				const link = links.find(l => l.key === e.key.toLowerCase());
				if (link) {
					history(link.link);
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [history]);

	return (
		<nav className="sidebar" onKeyDown={handleMenuKeyDown}>
			<div
				className="sidebar-header"
				onClick={onToggle}
				onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
				tabIndex="0"
				style={{ cursor: 'pointer' }}
				title={collapsed ? "Expand" : "Collapse"}
			>
				<div className="icon-box">
					<img src="/assets/logo.png" alt="Logo" style={{ width: '32px', height: '32px', flexShrink: 0 }} />
				</div>
				<div className="logo">DevX</div>
				<div className="header-toggle">
					<ChevronLeft size={16} />
				</div>
			</div>
			<ul className="menu" onFocus={handleMenuFocus}>
				{links.map((link) => {
					const Icon = link.icon;
					return (
						<li
							key={link.id}
							className={getLinkClass(link.id)}
							onClick={() => onLinkClick(link.link)}
							onKeyDown={(e) => e.key === "Enter" && onLinkClick(link.link)}
							tabIndex="0"
							title={collapsed ? `${link.text} (Alt+${link.key.toUpperCase()})` : ""}
						>
							<div className="icon-box">
								<Icon size={20} className="menu-icon" />
							</div>
							<span className="menu-text">{link.text}</span>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

export default Navigation;
