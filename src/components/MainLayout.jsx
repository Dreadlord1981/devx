import { useState } from "react";
import Navigation from "./Navigation";

function MainLayout({ children, active, working }) {
	const [collapsed, setCollapsed] = useState(true);

	return (
		<div className={`main ${collapsed ? 'sidebar-collapsed' : ''}`}>
			<Navigation
				active={active}
				working={working}
				collapsed={collapsed}
				onToggle={() => setCollapsed(!collapsed)}
			/>
			<main className="flex flex-col overflow-hidden">
				{children}
			</main>
		</div>
	);
}

export default MainLayout;
