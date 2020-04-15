// This script fetches your GitHub repos (sorted by most recently active),
// and then presents a prompt to pick one. A new issue is then created in
// that repo using the current draft's contents.
//
// NOTE: The first time you run this action you'll need to supply it with a
// GitHub Personal Access Token that has read/write permissions to the repos
// on your account. You can generate a token here:
// https://github.com/settings/tokens

let NumberOfRecentReposToFetch = 10;

var credential = Credential.create("GitHub", "A GitHub Personal Access Token with read/write repo permissions.");
credential.addTextField("token", "Personal Access Token");
credential.authorize();

let repos = getRecentRepos();
if (repos.length > 0) {
	let p = Prompt.create();
	p.title = "Choose Repo";
	for (var i = 0; i < repos.length; i++) {
		p.addButton(repos[i].full_name, i);
	}
	if (p.show()) {
        let path = getPath()
        if (path != null) {
            let full_name = repos[p.buttonPressed].full_name;
            //createGitHubIssue(full_name, draft.title, draft.content);
            commitFile(full_name, path)
        }
	}
}


function getPath() {
    var p = Prompt.create();

    p.title = 'Where is your blog?';
    p.message = 'Root folder to save this file';

    p.addTextField('path', 'Path', 'src/content/journal');

    p.addButton('Save');

    const didSelect = p.show();
    const path = p.fieldValues.path;

    if (path && p.buttonPressed == 'Save') {
        return path;
    }

    return null;
}


// Fetches the NumberOfRecentReposToFetch most recent repos
// (both public and private) from the authorized GitHub account.
function getRecentRepos() {
	var http = HTTP.create();
	var response = http.request({
		"url": "https://api.github.com/user/repos?sort=pushed&per_page=" + NumberOfRecentReposToFetch,
		"method": "GET",
		"headers": {
			"Authorization": "token " + credential.getValue("token"),
			"User-Agent": "Drafts-Issue-Bot"
		}
	});
	return JSON.parse(response.responseText);
}

// Create a new GitHub issue in the repo identified by full_name,
// which is in a "username/repo" format.
function createGitHubIssue(full_name, title, body) {
	var json = {
		title: title,
		body: body
	};

	var http = HTTP.create();
	var response = http.request({
		"url": "https://api.github.com/repos/" + full_name + "/issues",
		"method": "POST",
		"data": json,
		"headers": {
			"Authorization": "token " + credential.getValue("token"),
			"User-Agent": "Drafts-Issue-Bot"
		}
	});
}

function pad(n) {
    let str = String(n);
    while (str.length < 2) {
        str = `0${str}`;
    }
    return str;
}

function commitFile(full_name, path) {
    const http = HTTP.create(); // create HTTP object
    const base = 'https://api.github.com';
    
    const posttime = new Date();
    
    const datestr = `${posttime.getFullYear()}-${pad(posttime.getMonth() + 1)}-${pad(posttime.getDate())}`;
    const timestr = `${pad(posttime.getHours())}:${pad(posttime.getMinutes())}`;
    const slug = String((posttime.getHours() * 60 * 60) + (posttime.getMinutes() * 60) + posttime.getSeconds());
    
    const fn = `${datestr}-${slug}.md`;
    
    const options = {
        url: `https://api.github.com/repos/${full_name}/contents/${path}/${fn}`,
        method: 'PUT',
        data: {
            message: `micropost ${datestr}`,
            content: Base64.encode(draft.content)
        },
        headers: {
            'Authorization': 'token ' + credential.getValue("token"),
            "User-Agent": "Drafts-Publish-Bot"
        }
    };

    console.log(options.url)
    console.log(options.data.message)
    console.log(options.headers.Authorization)
    
    var response = http.request(options);

    if (response.success) {
        // yay
    } else {
        console.log(response.statusCode);
        console.log(response.error);
    }
}