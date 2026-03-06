import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/shell/locale-switcher";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sampleData = [
  { id: 1, name: "Friedrich Schiller", born: "1759", died: "1805", role: "Poet" },
  { id: 2, name: "Johann Wolfgang von Goethe", born: "1749", died: "1832", role: "Writer" },
  { id: 3, name: "Immanuel Kant", born: "1724", died: "1804", role: "Philosopher" },
  { id: 4, name: "Ludwig van Beethoven", born: "1770", died: "1827", role: "Composer" },
  { id: 5, name: "Alexander von Humboldt", born: "1769", died: "1859", role: "Explorer" },
];

export default function ShowcasePage() {
  const t = useTranslations("showcase");

  return (
    <div className="mx-auto max-w-4xl space-y-12 p-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">All base UI components in one place.</p>
      </div>

      {/* Buttons */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("buttons")}</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("inputs")}</h2>
        <div className="grid max-w-sm gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="default">Default input</Label>
            <Input id="default" placeholder="Enter text..." />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="disabled">Disabled</Label>
            <Input id="disabled" placeholder="Disabled..." disabled />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="error" className="text-destructive">
              With error
            </Label>
            <Input id="error" placeholder="Error state..." className="border-destructive" />
            <p className="text-xs text-destructive">This field is required</p>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("badges")}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("cards")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p>Basic card with content only.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card with header and footer.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Dialog */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("dialogs")}</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>This is a sample dialog with a description.</DialogDescription>
            </DialogHeader>
            <p className="text-sm">Dialog body content goes here.</p>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Tabs */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("tabs")}</h2>
        <Tabs defaultValue="tab1" className="max-w-md">
          <TabsList>
            <TabsTrigger value="tab1">Tab One</TabsTrigger>
            <TabsTrigger value="tab2">Tab Two</TabsTrigger>
            <TabsTrigger value="tab3">Tab Three</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <Card>
              <CardContent className="pt-6">Content of tab one.</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab2">
            <Card>
              <CardContent className="pt-6">Content of tab two.</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab3">
            <Card>
              <CardContent className="pt-6">Content of tab three.</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Table */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("tables")}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Born</TableHead>
              <TableHead>Died</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.born}</TableCell>
                <TableCell>{row.died}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.role}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Avatar */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Avatars</h2>
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg">LG</AvatarFallback>
          </Avatar>
        </div>
      </section>

      {/* Skeleton variants */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("skeletons")}</h2>
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">List variant</p>
            <Card>
              <PageSkeleton variant="list" />
            </Card>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Detail variant</p>
            <Card>
              <PageSkeleton variant="detail" />
            </Card>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Card-grid variant</p>
            <Card>
              <PageSkeleton variant="card-grid" />
            </Card>
          </div>
        </div>
      </section>

      {/* Theme toggle */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("theme")}</h2>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <p className="text-sm text-muted-foreground">
            Toggle between light, dark, and system theme
          </p>
        </div>
      </section>

      {/* Locale switcher */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("locale")}</h2>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <p className="text-sm text-muted-foreground">Switch between DE and EN</p>
        </div>
      </section>
    </div>
  );
}
