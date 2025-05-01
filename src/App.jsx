import { BrowserRouter, Routes, Route } from "react-router-dom";
import Theme from "./components/Theme";
import Exporter from "./components/Exporter";
import Builder from "./components/Builder";
import Creator from "./components/Creator";
import { invoke } from "@tauri-apps/api/tauri";
import "./styles/button.css";
import "./styles/field.css";
import "./styles/form.css";
import "./styles/layout.css";
import "./styles/toolbar.css";
import "./styles/output.css";
import { useState } from "react";
import Package from "./components/Package";
import Sysmin from "./components/Sysmin";
import Server from "./components/Server";

function App() {

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
		first: true
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
		release: false
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
		extends: [],
		selected: [],
		projects_selected: [],
		projects: []
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
		path: "$POPATH/../",
	});

	function onCheckChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.checked;

		let o_copy = {...exporter};

		o_copy[i_target.name] = value;

		setExporter(params => ({
			...o_copy
		}));
	};

	function onInputChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.value;

		let o_copy = {...exporter};

		o_copy[i_target.name] = value;

		setExporter(params => ({
			...o_copy
		}));
	};

	function onRepoChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.name;

		let o_copy = {...exporter};

		o_copy.repo = value;

		setExporter(params => ({
			...o_copy
		}));

		setSelected([i_target.name])
	}

	function onThemeCheckChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.checked;

		let o_copy = {...theme};

		o_copy[i_target.name] = value;

		setTheme(params => ({
			...o_copy
		}));
	};

	function onThemeInputChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.value;

		let o_copy = {...theme};

		o_copy[i_target.name] = value;

		setTheme(params => ({
			...o_copy
		}));
	};

	function onBuilderInputChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.type == "checkbox" ? i_target.checked : i_target.value;

		let o_copy = {...builder};

		o_copy[i_target.name] = value;

		setBuilder(params => ({
			...o_copy
		}));
	};

	function onPackageInputChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.value;

		let o_copy = {...statePackage};

		o_copy[i_target.name] = value;

		setStatePackage(params => ({
			...o_copy
		}));
	};

	function onSysminInputChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.value;

		let o_copy = {...stateSysmin};

		o_copy[i_target.name] = value;

		setStateSysmin(params => ({
			...o_copy
		}));
	};

	function onCreatorCheckChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.checked;

		let o_copy = {...creator};

		o_copy.selected = [
			i_target.name
		];

		setCreator(params => ({
			...o_copy
		}));
	};
	
	function onCreatorProjectCheckChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.checked;

		let o_copy = {...creator};

		o_copy.project_selected = [
			i_target.name
		];

		setCreator(params => ({
			...o_copy
		}));
	};

	function onCreatorInputChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.value;

		let o_copy = {...creator};

		o_copy[i_target.name] = value;

		setCreator(params => ({
			...o_copy
		}));
	};
	
	async function onThemeChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.value;

		let o_copy = {...theme};

		o_copy[i_target.name] = value;

		let a_packages = await invoke("get_packages", {theme: value});

		setPackages(a_packages);

		setSelectedPackages([])

		setTheme(params => ({
			...o_copy
		}));
	}

	async function getProjectConfig() {

		let o_copy = {...creator};

		let a_projects = await invoke("get_themes", {});

		let a_packages = await invoke("get_packages", {theme: "sitemule"});

		o_copy.extends = a_packages;
		o_copy.projects = a_projects;

		setCreator(o_copy);

	}

	async function onPathChange(i_event) {

		var i_target = i_event.target;
		var value = i_target.value;

		let o_copy = {...exporter};

		o_copy[i_target.name] = value;

		let a_repoes = await invoke("get_repoes", {path: value});

		o_copy.repoes = a_repoes;

		setPath(value);

		setSelected([]);

		setExporter(params => ({
			...o_copy
		}));
	}

	async function onServerPathChange(i_event) {

		var i_target = i_event.target;
		var value = i_target.value;

		let o_copy = {...server};

		o_copy[i_target.name] = value;

		let a_servers = await invoke("get_server_list", {path: value});

		o_copy.servers = a_servers;

		setServer(params => ({
			...o_copy
		}));
	}

	async function onServerChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.name;

		let o_copy = {...server};

		o_copy.server = value;

		let a_configs = await invoke("get_server_configs", {path: o_copy.path, server: value});

		o_copy.configs = a_configs;

		setServer(params => ({
			...o_copy
		}));

	}

	async function onConfigChange(i_event) {
		
		var i_target = i_event.target;
		var value = i_target.name;

		let o_copy = {...server};

		o_copy.config = value;

		setServer(params => ({
			...o_copy
		}));

	}

	function onPackageChange(i_event) {
		
		var i_target = i_event.target;
		var b_checked = i_target.checked;

		let a_copy = [...selectedPackages];

		if (b_checked) {
			a_copy.push(i_target.name);
		}
		else {
			a_copy = a_copy.filter(function(s_name) {
				return s_name != i_target.name
			});
		}

		setSelectedPackages(selected => a_copy);
	}

	async function onFirst() {

		let o_copy = {...exporter};
		let a_repoes = await invoke("get_repoes", {path: o_copy.path});

		o_copy.first = false;
		o_copy.repoes = a_repoes;

		setExporter(params => ({
			...o_copy
		}));

	}

	return (
		<BrowserRouter>
			<Routes>
				<Route path="*" element={ <Exporter state={exporter} onCheckChange={onCheckChange} onInputChange={onInputChange} onRepoChange={onRepoChange} selected={selected} onPathChange={onPathChange} onFirst={onFirst} /> } />
				<Route path="/exporter" element={ <Exporter state={exporter} onCheckChange={onCheckChange} onInputChange={onInputChange} onRepoChange={onRepoChange} selected={selected} onPathChange={onPathChange} onFirst={onFirst} /> } />
				<Route path="/theme" element={ <Theme state={theme} onCheckChange={onThemeCheckChange} onInputChange={onThemeInputChange} onThemeChange={onThemeChange} packages={packages} selected={selectedPackages} onPackageChange={onPackageChange} /> } />
				<Route path="/creator" element={ <Creator state={creator} onInputChange={onCreatorInputChange} onCheckChange={onCreatorCheckChange} getProjectConfig={getProjectConfig} onProjectChange={onCreatorProjectCheckChange} /> } />
				<Route path="/builder" element={ <Builder state={builder} onInputChange={onBuilderInputChange} options={buildOptions} /> } />
				<Route path="/package" element={ <Package state={statePackage} onInputChange={onPackageInputChange} /> } />
				<Route path="/sysmin" element={ <Sysmin state={stateSysmin} onInputChange={onSysminInputChange} /> } />
				<Route path="/server" element={ <Server state={server} onInputChange={onServerPathChange} onServerChange={onServerChange} onConfigChange={onConfigChange} /> } />
			</Routes>
		</BrowserRouter>
		
	)
}

export default App;
