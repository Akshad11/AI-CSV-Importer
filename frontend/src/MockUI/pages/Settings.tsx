import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Manage your account settings and AI preferences.</p>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Mapping Configuration</CardTitle>
              <CardDescription>Adjust how the AI extracts data from your CSV files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Confidence Threshold (%)</label>
                <Input type="number" defaultValue="85" />
                <p className="text-xs text-slate-500">Matches below this threshold will require manual review.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Lead Source</label>
                <Input defaultValue="Organic Search" />
              </div>
              <Button className="w-full sm:w-auto">Save Preferences</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full sm:w-auto">Clear Import History</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
