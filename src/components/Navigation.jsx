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
		<nav className="sidebar">
			<div className="sidebar-header" onClick={onToggle} style={{ cursor: 'pointer' }} title={collapsed ? "Expand" : "Collapse"}>
				<img src="/assets/logo.png" alt="Logo" style={{ width: '32px', height: '32px', marginRight: collapsed ? '0' : '10px', transition: 'margin 0.3s' }} />
				{!collapsed && (
					<>
						<div className="logo" style={{ flex: 1 }}>DevX</div>
						<div className="header-toggle">
							<ChevronLeft size={16} />
						</div>
					</>
				)}
			</div>
			<ul className="menu">
				{links.map((link) => {
					const Icon = link.icon;
					return (
						<li
							key={link.id}
							className={getLinkClass(link.id)}
							onClick={() => onLinkClick(link.link)}
							title={collapsed ? `${link.text} (Alt+${link.key.toUpperCase()})` : ""}
						>
							<Icon size={20} className="menu-icon" />
							{!collapsed && <span className="menu-text">{link.text}</span>}
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

export default Navigation;
