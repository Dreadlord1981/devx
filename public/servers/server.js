const { appWindow } = window.__TAURI__.window;;

const a_log = [];

function onReady() {

	var i_log = document.getElementById("server-log");

	appWindow.listen("server-status", function(i_event) {

		let o_playload = i_event.payload || {};

		let s_message = o_playload.message;

		let n_index = s_message.lastIndexOf("\n");

		s_message = s_message.substring(0, n_index);

		a_log.push(s_message);
		
		let s_log = a_log.join("\n");

		i_log.innerText = s_log;

		const scrollHeight = i_log.scrollHeight;
        const height = i_log.clientHeight;
        const maxScrollTop = scrollHeight - height;
        i_log.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
	});

	appWindow.listen("server-error", function(o_playload) {

		i_log.innerText = o_playload.message;
	});
};

onReady();