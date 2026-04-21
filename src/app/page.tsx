import { getPilots } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, QrCode, Send, User } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const pilots = await getPilots();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'default';
      case 'Checked In':
        return 'secondary';
      case 'Pending Payment':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Manage pilot registrations and event operations."
      >
        <Link href="/register">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Register Pilot
          </Button>
        </Link>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pilots
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pilots.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently registered participants
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/scan" className='flex-1'>
            <Button variant="outline" className="w-full">
              <QrCode className="mr-2 h-4 w-4" /> Scan
            </Button>
            </Link>
            <Link href="/communicate" className='flex-1'>
            <Button variant="outline" className="w-full">
              <Send className="mr-2 h-4 w-4" /> Message
            </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Pilots</CardTitle>
          <CardDescription>
            A list of all pilots registered for the event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pilot</TableHead>
                <TableHead className="hidden md:table-cell">Team</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden sm:table-cell">Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pilots.map((pilot) => (
                <TableRow key={pilot.id}>
                  <TableCell>
                    <div className="font-medium">{pilot.name}</div>
                    <div className="text-sm text-muted-foreground md:hidden">{pilot.teamName || 'No Team'}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{pilot.teamName || 'No Team'}</TableCell>
                  <TableCell>{pilot.category}</TableCell>
                  <TableCell className="hidden sm:table-cell">{new Date(pilot.registrationDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(pilot.status)}>{pilot.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/pilots/${pilot.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
