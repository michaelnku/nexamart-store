export default function SettingsRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="h-full min-h-full">{children}</div>;
}
