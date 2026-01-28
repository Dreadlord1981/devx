import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Toolbar from "./Toolbar";

function Theme(props) {

	let state = props.state
	let packages = props.packages;
	let selected = props.selected;
	let setWorking = props.setWorking;

	const logRef = useRef(null);
	const inputRef = useRef(null);

	const [internalWorking, setInternalWorking] = useState(false);
	const [log, setLog] = useState("");

	function isValid() {

		let valid = state.clean;
		let packageSelected = false;

		if (valid) {

			if (
				state.build ||
				state.zip ||
				state.update ||
				state.export
			) {
				valid = state.theme != ""
			}
		}

		if (!valid) {

			packages.forEach(function (o_config) {

				if (!packageSelected) {
					packageSelected = isSelected(o_config.name);
				}
			});

			valid = packageSelected;

			if (valid) {

				if (state.export) {

					valid = (
						state.user &&
						state.password &&
						state.host &&
						state.icebreak &&
						state.ifs
					);
				}
				else {
					valid = (
						state.build ||
						state.zip ||
						state.update
					)
				}
			}
		}

		return valid && !internalWorking;
	}

	function updatestatus(o_payload, b_done) {

		const s_message = o_payload.message || "";

		if (o_payload.update) {
			setLog(function (s_prev) {
				const n_count = (s_message.match(/\n/g) || []).length + 1;
				let n_pos = s_prev.length;
				for (let i = 0; i < n_count; i++) {
					const n_next = s_prev.lastIndexOf("\n", n_pos - 1);
					if (n_next === -1) {
						n_pos = -1;
						break;
					}
					n_pos = n_next;
				}
				return (n_pos === -1 ? "" : s_prev.substring(0, n_pos + 1)) + s_message;
			});
		}
		else {
			setLog(function (s_prev) {
				return s_prev + s_message;
			});
		}

		if (b_done) {
			setInternalWorking(false);
			setWorking(false);
		}

	}

	function isSelected(s_value) {

		var b_found = false;

		selected.forEach(function (s_search) {
			if (s_search == s_value) {
				b_found = true;
			}
		});

		return b_found;
	}

	async function onClick() {

		setLog("")
		setInternalWorking(true);
		setWorking(true);

		let s_packages = selected.join(" ");

		let o_args = {
			...state
		};

		o_args.packages = s_packages;

		await invoke("packer", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function () {

		invoke("update_title", { title: "Theme builder / exporter" });

		if (inputRef.current) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("theme-status", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("theme-error", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("theme-done", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		if (logRef.current) {
			const scrollHeight = logRef.current.scrollHeight;
			const height = logRef.current.clientHeight;
			const maxScrollTop = scrollHeight - height;
			logRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
		}

		return () => {
			status.then(function (f_callback) {
				f_callback();
			});

			error.then(function (f_callback) {
				f_callback();
			});

			done.then(function (f_callback) {
				f_callback();
			});
		}
	}, [log])

	return (
		<div className="container">
			<div className="content-wrapper">
				<div className="form-area">
					<fieldset disabled={internalWorking}>
						<legend>Info</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="theme">Theme:</label>
							<input className="field-input" ref={inputRef} onChange={props.onThemeChange} value={state.theme} name="theme"></input>
						</div>
					</fieldset>
					<fieldset disabled={internalWorking}>
						<legend>Server</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="host">Host:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.host} name="host"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="user">User:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.user} name="user"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="password">Password:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.password} type="password" name="password"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="password">IceBreak IFS:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.icebreak} name="icebreak"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="password">IFS:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.ifs} name="ifs"></input>
						</div>
					</fieldset>
					<fieldset disabled={internalWorking}>
						<legend>Action</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="build">Build:</label>
							<input type="checkbox" onChange={props.onCheckChange} checked={state.build} className="field-input" name="build"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="update">Update:</label>
							<input type="checkbox" onChange={props.onCheckChange} checked={state.update} className="field-input" name="update"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="clean">Clean:</label>
							<input type="checkbox" onChange={props.onCheckChange} checked={state.clean} className="field-input" name="clean"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="export">Zip:</label>
							<input type="checkbox" onChange={props.onCheckChange} checked={state.zip} className="field-input" name="zip"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="export">Export:</label>
							<input type="checkbox" onChange={props.onCheckChange} checked={state.export} className="field-input" name="export"></input>
						</div>
					</fieldset>
					{packages.length > 0 &&
						<fieldset disabled={internalWorking}>
							<legend>Packages</legend>
							{
								packages.map(function (o_config) {
									return <div key={o_config.name} className="field-wrapper">
										<label className="field-label" htmlFor={o_config.name}>{o_config.name}</label>
										<input type="checkbox" checked={isSelected(o_config.name)} onChange={props.onPackageChange} className="field-input" name={o_config.name}></input>
									</div>
								})
							}
						</fieldset>
					}
				</div>
				<div className="output-area">
					<div className="output-header">Logs</div>
					<div className="output" ref={logRef}>
						<pre>{log}</pre>
					</div>
				</div>
			</div>
			<Toolbar onClearClick={onClearClick} onClick={onClick} valid={isValid()} />
		</div>
	);
}

export default Theme;
