$file = "c:\Users\Krishna\TT\frontend\src\pages\Profile.jsx"
$content = Get-Content $file -Raw
$old = 'src={`${API_BASE}${profile.profilePhoto}`}'
$new = 'src={getImageUrl(profile.profilePhoto, API_BASE)}'
$content = $content.Replace($old, $new)
Set-Content $file $content -NoNewline
Write-Output "Profile.jsx updated"
