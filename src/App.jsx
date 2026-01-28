import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Theme from "./components/Theme";
import Exporter from "./components/Exporter";
import Builder from "./components/Builder";
import Creator from "./components/Creator";
import Package from "./components/Package";
import Sysmin from "./components/Sysmin";
import Server from "./components/Server";
import MainLayout from "./components/MainLayout";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow, WebviewWindow, getAll } from "@tauri-apps/api/window";


function AppContent() {
	const location = useLocation();
	const activeRoute = location.pathname.split("/")[1] || "exporter";

	let [exporter, setExporter] = useState({
		host: "",
		user: "",
		password: "",
		destination: "",
		branch: "",
		export: true,
		create: false,
		dist: false,
		pack: false,
		repo: "portfolio",
		repoes: [],
		path: "$POPATH/..",
		first: true,
		ftp: true
	});

	let [theme, setTheme] = useState({
		host: "",
		user: "",
		password: "",
		icebreak: "/IceBreak",
		ifs: "/IceBreak/System/shared/theme",
		theme: "",
		packages: [],
		export: false,
		zip: false,
		clean: false,
		build: false,
		update: false
	});

	let [builder, setBuilder] = useState({
		host: "",
		user: "",
		password: "",
		ifs: "/prj/icecap",
		build: "all",
		deploy: "CAPQA",
		bin: "CAPDEV",
		build_icecap: false,
		build_portfolio: false,
		release: false,
		target: "*CURRENT"
	});

	let [statePackage, setStatePackage] = useState({
		host: "",
		user: "",
		password: "",
		ifs: "/prj/icecap",
		build: "all",
		deploy: "CAPQA",
		bin: "CAPDEV",
		build_icecap: false,
		build_portfolio: false,
		package: "i"
	});

	let [creator, setCreator] = useState({
		name: "",
		path: "$POPATH/../themes",
		extends: [],
		selected: [],
		projects_selected: [],
		projects: [],
		create: true,
		generate: false
	});

	const [selected, setSelected] = useState(["portfolio"]);
	const [selectedPackages, setSelectedPackages] = useState([]);
	const [packages, setPackages] = useState([]);
	const [path, setPath] = useState([]);
	const [buildOptions, setBuildOptions] = useState([
		{
			value: "all",
			label: "All"
		}
	]);

	let [stateSysmin, setStateSysmin] = useState({
		system: "i"
	});

	let [server, setServer] = useState({
		server: "",
		servers: [],
		configs: [],
		config: "",
		port: 0,
		https: false,
		cache: false,
		path: "$POPATH/../",
	});

	const [working, setWorking] = useState(false);

	function onCheckChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.checked;
		let o_copy = { ...exporter };
		o_copy[i_target.name] = value;
		setExporter(o_copy);
	};

	function onInputChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...exporter };
		o_copy[i_target.name] = value;
		setExporter(o_copy);
	};

	function onRepoChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.name;
		let o_copy = { ...exporter };
		o_copy.repo = value;
		setExporter(o_copy);
		setSelected([i_target.name]);
	}

	function onThemeCheckChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.checked;
		let o_copy = { ...theme };
		o_copy[i_target.name] = value;
		setTheme(o_copy);
	};

	function onThemeInputChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...theme };
		o_copy[i_target.name] = value;
		setTheme(o_copy);
	};

	function onBuilderInputChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.type == "checkbox" ? i_target.checked : i_target.value;
		let o_copy = { ...builder };
		o_copy[i_target.name] = value;
		setBuilder(o_copy);
	};

	function onPackageInputChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...statePackage };
		o_copy[i_target.name] = value;
		setStatePackage(o_copy);
	};

	function onSysminInputChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...stateSysmin };
		o_copy[i_target.name] = value;
		setStateSysmin(o_copy);
	};

	function onCreatorExtendCheckChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.checked;
		let o_copy = { ...creator };
		let a_selected = Array.prototype.slice.call(o_copy.selected);

		if (!value) {
			a_selected = a_selected.filter(s_name => s_name != i_target.name);
		} else {
			a_selected.push(i_target.name);
		}

		a_selected.sort();
		o_copy.selected = a_selected;
		setCreator(o_copy);
	};

	function onCreatorProjectCheckChange(i_event) {
		var i_target = i_event.target;
		let o_copy = { ...creator };
		o_copy.projects_selected = [i_target.name];
		o_copy.selected = [];
		setCreator(o_copy);
	};

	function onCreatorInputChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...creator };
		o_copy[i_target.name] = value;
		setCreator(o_copy);
	};

	async function onCreatorOptionChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.checked;
		let o_copy = { ...creator };

		if (value) {
			o_copy[i_target.name] = value;
		}

		if (i_target.name == "create") {
			o_copy.generate = false;
		}

		if (i_target.name == "generate") {
			o_copy.create = false;
		}

		let o_config = await getProjectConfig();
		o_copy.projects = o_config.projects;
		o_copy.extends = o_config.packages;

		setCreator(o_copy);
	};

	async function onThemeChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...theme };
		o_copy[i_target.name] = value;

		let a_packages = await invoke("get_packages", { theme: value });
		setPackages(a_packages);
		setSelectedPackages([]);
		setTheme(o_copy);
	}

	async function getProjectConfig() {
		let a_projects = await invoke("get_themes", {});
		let a_packages = await invoke("get_packages", { theme: "sitemule" });

		return {
			projects: a_projects,
			packages: a_packages
		};
	}

	async function onPathChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...exporter };
		o_copy[i_target.name] = value;

		let a_repoes = await invoke("get_repoes", { path: value });
		o_copy.repoes = a_repoes;
		setPath(value);
		setSelected([]);
		setExporter(o_copy);
	}

	async function onServerPathChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...server };
		o_copy[i_target.name] = value;

		let a_servers = await invoke("get_server_list", { path: value });
		o_copy.servers = a_servers;
		setServer(o_copy);
	}

	async function onServerChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.name;
		let o_copy = { ...server };

		if (o_copy.server != value) {
			o_copy.config = "";
		}

		o_copy.server = value;
		let a_configs = await invoke("get_server_configs", { path: o_copy.path, server: value });
		o_copy.configs = a_configs;
		setServer(o_copy);
	}

	async function onConfigChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.name;
		var port = parseInt(i_target.getAttribute("port"));
		var https = Boolean.apply(null, [parseInt(i_target.getAttribute("mode"))])

		let o_copy = { ...server };
		o_copy.config = value;
		o_copy.port = port;
		o_copy.https = https;
		setServer(o_copy);
	}

	function onPackageChange(i_event) {
		var i_target = i_event.target;
		var b_checked = i_target.checked;
		let a_copy = [...selectedPackages];

		if (b_checked) {
			a_copy.push(i_target.name);
		} else {
			a_copy = a_copy.filter(s_name => s_name != i_target.name);
		}
		setSelectedPackages(a_copy);
	}

	async function onFirst() {
		let o_copy = { ...exporter };
		let a_repoes = await invoke("get_repoes", { path: o_copy.path });
		o_copy.first = false;
		o_copy.repoes = a_repoes;
		setExporter(o_copy);
	}

	function onServerCacheChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...server };
		o_copy.cache = Boolean.apply(null, [parseInt(value)]);
		setServer(o_copy);
	};

	function onFtpChange(i_event) {
		var i_target = i_event.target;
		var value = i_target.value;
		let o_copy = { ...exporter };
		o_copy.ftp = Boolean.apply(null, [parseInt(value)]);
		setExporter(o_copy);
	};

	useEffect(() => {
		// Close splashscreen and show main window
		const timer = setTimeout(async () => {
			try {
				const splash = WebviewWindow.getByLabel('splashscreen');
				if (splash) {
					await splash.close();
				}
				await appWindow.show();
				await appWindow.setFocus();
			} catch (e) {
				console.error("Splash transition failed", e);
				appWindow.show();
			}
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<MainLayout active={activeRoute} working={working}>
			<Routes>
				<Route path="*" element={<Exporter state={exporter} onCheckChange={onCheckChange} onInputChange={onInputChange} onRepoChange={onRepoChange} selected={selected} onPathChange={onPathChange} onFirst={onFirst} onFtpChange={onFtpChange} setWorking={setWorking} />} />
				<Route path="/exporter" element={<Exporter state={exporter} onCheckChange={onCheckChange} onInputChange={onInputChange} onRepoChange={onRepoChange} selected={selected} onPathChange={onPathChange} onFirst={onFirst} onFtpChange={onFtpChange} setWorking={setWorking} />} />
				<Route path="/theme" element={<Theme state={theme} onCheckChange={onThemeCheckChange} onInputChange={onThemeInputChange} onThemeChange={onThemeChange} packages={packages} selected={selectedPackages} onPackageChange={onPackageChange} setWorking={setWorking} />} />
				<Route path="/creator" element={<Creator state={creator} onInputChange={onCreatorInputChange} onExtendChange={onCreatorExtendCheckChange} getProjectConfig={getProjectConfig} onProjectChange={onCreatorProjectCheckChange} onOptionChange={onCreatorOptionChange} setWorking={setWorking} />} />
				<Route path="/builder" element={<Builder state={builder} onInputChange={onBuilderInputChange} options={buildOptions} setWorking={setWorking} />} />
				<Route path="/package" element={<Package state={statePackage} onInputChange={onPackageInputChange} setWorking={setWorking} />} />
				<Route path="/sysmin" element={<Sysmin state={stateSysmin} onInputChange={onSysminInputChange} setWorking={setWorking} />} />
				<Route path="/server" element={<Server state={server} onInputChange={onServerPathChange} onServerChange={onServerChange} onConfigChange={onConfigChange} onServerCacheChange={onServerCacheChange} setWorking={setWorking} />} />
			</Routes>
		</MainLayout>
	);
}

function App() {
	return (
		<BrowserRouter>
			<AppContent />
		</BrowserRouter>
	);
}

export default App;
