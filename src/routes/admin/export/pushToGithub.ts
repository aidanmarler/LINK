export async function pushFolderToGitHub(
	files: Record<string, string>, // path -> csv content
	commitMessage: string,
	owner: string = 'aidanmarler', //'ISARICResearch',
	repo: string = 'ARC-Reviewed-Translations', //'ARC-Translations',
	branch: string = 'main'
) {
	const githubToken = import.meta.env.VITE_GITHUB_TOKEN_2;
	const auth = {
		headers: {
			Authorization: `Bearer ${githubToken}`,
			'Content-Type': 'application/json'
		}
	};
	const base = `https://api.github.com/repos/${owner}/${repo}`;

	// ── STEP 1 ── Get the current branch SHA (tip of branch)
	const branchRes = await fetch(`${base}/branches/${branch}`, auth);
	console.log('branchRes', branchRes);

	if (!branchRes.ok) throw new Error(`Branch fetch error: ${branchRes.status}`);
	const branchData = await branchRes.json();
	const latestCommitSha: string = branchData.commit.sha;
	const baseTreeSha: string = branchData.commit.commit.tree.sha;

	console.log('branchData', branchData);

	// ── STEP 2 ── Upload each file as a blob, collect SHAs
	const treeItems = await Promise.all(
		Object.entries(files).map(async ([path, content]) => {
			// Encode content to base64
			const base64Content = btoa(unescape(encodeURIComponent(content)));

			const blobRes = await fetch(`${base}/git/blobs`, {
				method: 'POST',
				...auth,
				body: JSON.stringify({ content: base64Content, encoding: 'base64' })
			});
			if (!blobRes.ok) throw new Error(`Blob upload error at ${path}: ${blobRes.status}`);
			const blob = await blobRes.json();

			return {
				path, // e.g. "ARCH3.0/English/ARCH.csv"
				mode: '100644', // standard file mode (matches what you pull)
				type: 'blob',
				sha: blob.sha
			};
		})
	);

	console.log('treeItems', treeItems);

	// ── STEP 3 ── Create a new tree on top of the existing one
	// base_tree: existing tree SHA — files NOT in your list are preserved
	const treeRes = await fetch(`${base}/git/trees`, {
		method: 'POST',
		...auth,
		body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
	});

	console.log('treeRes', treeRes);

	if (!treeRes.ok) throw new Error(`Tree creation error: ${treeRes.status}`);
	const newTree = await treeRes.json();

	// ── STEP 4 ── Create a commit pointing to the new tree
	const commitRes = await fetch(`${base}/git/commits`, {
		method: 'POST',
		...auth,
		body: JSON.stringify({
			message: commitMessage,
			tree: newTree.sha,
			parents: [latestCommitSha] // builds on top of current HEAD
		})
	});

	console.log('commitRes', commitRes);

	if (!commitRes.ok) throw new Error(`Commit error: ${commitRes.status}`);
	const newCommit = await commitRes.json();

	// ── STEP 5 ── Move the branch ref to point at the new commit
	const refRes = await fetch(`${base}/git/refs/heads/${branch}`, {
		method: 'PATCH',
		...auth,
		body: JSON.stringify({ sha: newCommit.sha })
	});


	console.log('refRes', refRes);

	if (!refRes.ok) throw new Error(`Ref update error: ${refRes.status}`);

	return newCommit.sha;
}
