/**
 * Returnerer utgiverens release-side når image-navnet har en pålitelig kobling
 * til et prosjekt. Ukjente images får ingen lenke, i stedet for en misvisende
 * eller ødelagt «release notes»-knapp.
 */
export function releaseNotesUrl(image: string): string | null {
  const repository = image.trim().split('@', 1)[0].split(':', 1)[0];
  const parts = repository.split('/');

  // ghcr.io/<owner>/<repository> følger normalt GitHub-repoet med samme navn.
  if (parts[0] === 'ghcr.io' && parts.length >= 3) {
    const [owner, repo] = parts.slice(1, 3);
    return `https://github.com/${owner}/${repo}/releases`;
  }

  // LinuxServer.io bruker den faste mappingen linuxserver/docker-<image>.
  if (parts[0] === 'lscr.io' && parts[1] === 'linuxserver' && parts.length === 3) {
    return `https://github.com/linuxserver/docker-${parts[2]}/releases`;
  }

  return null;
}
