import { useEffect, useId } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import "../styles/navigation.css";
import { useNavigate } from "react-router";

function Navigation(props) {


	let history = useNavigate();

	function onLinkClick(i_event) {
		
		var s_path = i_event.target.id;

		i_event.preventDefault();
		i_event.stopPropagation();

		history([
			"/",
			s_path
		].join(""));
	}

	var s_active = props.active

	var links = [
		{
			text: "E",
			id: "exporter",
			link: "/exporter"
		},
		{
			text: "T",
			id: "theme",
			link: "/theme"
		},
		{
			text: "C",
			id: "creator",
			link: "/creator"
		},
		{
			text: "B",
			id: "builder",
			link: "/builder"
		},
		{
			text: "P",
			id: "package",
			link: "/package"
		}
	]

	function isActive(value, s_active) {
		return "menu-item" + (value == s_active ? " " + "selected" : "")
	}

	useEffect(function() {

		let f_keydown = function(i_event) {
			
			if (i_event.altKey) {

				if (i_event.key == "e") {
					history("/exporter");
				}
				else if (i_event.key == "t") {
					history("/theme");
				}
				else if (i_event.key == "b") {
					history("/builder");
				}
				else if (i_event.key == "p") {
					history("/package");
				}
			}
		};

		document.addEventListener("keydown", f_keydown);

		return () => {
			document.removeEventListener("keydown", f_keydown);
		}
	}, []);

	return (
		<>
			<ul className="menu">
				{
					links.map(function(o_config) {
						const s_a_id = useId();
						const s_li_id = useId();

						return <li id={o_config.id} key={s_li_id} className={isActive(o_config.id, s_active)} onClick={onLinkClick} >{o_config.text}</li>;
					})
				}
			</ul>
		</>
	);
}

export default Navigation