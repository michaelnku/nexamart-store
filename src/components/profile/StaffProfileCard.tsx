type StaffProfileCardProps = {
  staffProfile?: unknown;
};

export function StaffProfileCard({ staffProfile }: StaffProfileCardProps) {
  void staffProfile;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="text-lg font-semibold text-gray-900">Staff Profile</h2>
      <p className="mt-2 text-sm text-gray-600">
        Staff profile information will appear here.
      </p>
    </section>
  );
}
