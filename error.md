npm run dev

> frontend@0.0.0 dev
> vite

12:49:02 pm [vite] (client) Re-optimizing dependencies because lockfile has changed

  VITE v7.3.1  ready in 504 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
(!) Failed to run dependency scan. Skipping dependency pre-bundling. Error:   Failed to scan for dependencies from entries:
  c:/Users/anmol/OneDrive/Desktop/CRM - Copy/frontend/index.html

  X [ERROR] Expected "from" but found "'../../lib/utils'"

    src/components/layout/Sidebar.tsx:5:14:
      5 │ import { cn } '../../lib/utils';
        │               ~~~~~~~~~~~~~~~~~
        ╵               from


    at failureErrorWithLog (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:1467:15)
    at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:926:25
    at runOnEndCallbacks (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:1307:45)
    at buildResponseToResult (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:924:7)
    at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:936:9
    at new Promise (<anonymous>)
    at requestCallbacks.on-end (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:935:54)
    at handleRequest (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:628:17)
    at handleIncomingPacket (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:653:7)
    at Socket.readFromStdout (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\esbuild\lib\main.js:581:7)
12:49:14 pm [vite] (client) Pre-transform error: C:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\src\components\layout\Sidebar.tsx: Unexpected token, expected "from" (5:14)

  3 | import { LayoutDashboard, Users, User, FileText, CheckCircle, Settings as SettingsIcon, UserSquare, BarChart3 } from 'lucide-react';
  4 | import { useAuth } from '../../context/AuthContext';
> 5 | import { cn } '../../lib/utils';
    |               ^
  6 | import logo from '../../assets/logo.png';
  7 |
  8 | export const Sidebar: React.FC = () => {
  Plugin: vite:react-babel
  File: C:/Users/anmol/OneDrive/Desktop/CRM - Copy/frontend/src/components/layout/Sidebar.tsx:5:14
  3  |  import { LayoutDashboard, Users, User, FileText, CheckCircle, Settings as SettingsIcon, UserSquare, BarChart3 } from ...
  4  |  import { useAuth } from '../../context/AuthContext';
  5  |  import { cn } '../../lib/utils';
     |                    ^
  6  |  import logo from '../../assets/logo.png';
  7  |
12:49:14 pm [vite] Internal server error: C:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\src\components\layout\Sidebar.tsx: Unexpected token, expected "from" (5:14)

  3 | import { LayoutDashboard, Users, User, FileText, CheckCircle, Settings as SettingsIcon, UserSquare, BarChart3 } from 'lucide-react';
  4 | import { useAuth } from '../../context/AuthContext';
> 5 | import { cn } '../../lib/utils';
    |               ^
  6 | import logo from '../../assets/logo.png';
  7 |
  8 | export const Sidebar: React.FC = () => {
  Plugin: vite:react-babel
  File: C:/Users/anmol/OneDrive/Desktop/CRM - Copy/frontend/src/components/layout/Sidebar.tsx:5:14
  3  |  import { LayoutDashboard, Users, User, FileText, CheckCircle, Settings as SettingsIcon, UserSquare, BarChart3 } from ...
  4  |  import { useAuth } from '../../context/AuthContext';
  5  |  import { cn } '../../lib/utils';
     |                    ^
  6  |  import logo from '../../assets/logo.png';
  7  |
      at constructor (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:365:19)
      at TypeScriptParserMixin.raise (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:6599:19)
      at TypeScriptParserMixin.unexpected (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:6619:16)
      at TypeScriptParserMixin.expectContextual (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:6878:12)
      at TypeScriptParserMixin.parseImportSpecifiersAndAfter (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:14243:10)
      at TypeScriptParserMixin.parseImport (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:14235:17)
      at TypeScriptParserMixin.parseImport (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:9353:26)
      at TypeScriptParserMixin.parseStatementContent (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12876:27)
      at TypeScriptParserMixin.parseStatementContent (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:9508:18)
      at TypeScriptParserMixin.parseStatementLike (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12767:17)
      at TypeScriptParserMixin.parseModuleItem (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12744:17)
      at TypeScriptParserMixin.parseBlockOrModuleBlockBody (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:13316:36)
      at TypeScriptParserMixin.parseBlockBody (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:13309:10)
      at TypeScriptParserMixin.parseProgram (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12622:10)
      at TypeScriptParserMixin.parseTopLevel (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12612:25)
      at TypeScriptParserMixin.parse (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:14488:25)
      at TypeScriptParserMixin.parse (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:10126:18)
      at parse (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:14522:38)
      at parser (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\parser\index.js:41:34)
      at parser.next (<anonymous>)
      at normalizeFile (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\transformation\normalize-file.js:64:37)
      at normalizeFile.next (<anonymous>)
      at run (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\transformation\index.js:22:50)
      at run.next (<anonymous>)
      at transform (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\transform.js:22:33)
      at transform.next (<anonymous>)
      at step (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:261:32)
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:273:13
      at async.call.result.err.err (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:223:11)
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:189:28
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\gensync-utils\async.js:67:7
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:113:33
      at step (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:287:14)
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:273:13
      at async.call.result.err.err (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:223:11)
12:49:18 pm [vite] (client) ✨ new dependencies optimized: react-dom/client, react-router-dom, @tanstack/react-query, sonner, jwt-decode, lucide-react, dayjs, dayjs/plugin/relativeTime, recharts, react-hook-form, @hookform/resolvers/zod, zod, axios, @tanstack/react-table, @radix-ui/react-dialog, clsx, tailwind-merge
12:49:18 pm [vite] (client) ✨ optimized dependencies changed. reloading
12:49:19 pm [vite] (client) Pre-transform error: C:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\src\components\layout\Sidebar.tsx: Unexpected token, expected "from" (5:14)

  3 | import { LayoutDashboard, Users, User, FileText, CheckCircle, Settings as SettingsIcon, UserSquare, BarChart3 } from 'lucide-react';
  4 | import { useAuth } from '../../context/AuthContext';
12:49:19 pm [vite] Internal server error: C:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\src\components\layout\Sidebar.tsx: Unexpected token, expected "from" (5:14)

  3 | import { LayoutDashboard, Users, User, FileText, CheckCircle, Settings as SettingsIcon, UserSquare, BarChart3 } from 'lucide-react';
  4 | import { useAuth } from '../../context/AuthContext';
> 5 | import { cn } '../../lib/utils';
    |               ^
  6 | import logo from '../../assets/logo.png';
  7 |
  8 | export const Sidebar: React.FC = () => {
  Plugin: vite:react-babel
  File: C:/Users/anmol/OneDrive/Desktop/CRM - Copy/frontend/src/components/layout/Sidebar.tsx:5:14
  3  |  import { LayoutDashboard, Users, User, FileText, CheckCircle, Settings as SettingsIcon, UserSquare, BarChart3 } from ...
  4  |  import { useAuth } from '../../context/AuthContext';
  5  |  import { cn } '../../lib/utils';
     |                    ^
  6  |  import logo from '../../assets/logo.png';
  7  |
      at constructor (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:365:19)
      at TypeScriptParserMixin.raise (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:6599:19)
      at TypeScriptParserMixin.unexpected (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:6619:16)
      at TypeScriptParserMixin.expectContextual (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:6878:12)
      at TypeScriptParserMixin.parseImportSpecifiersAndAfter (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:14243:10)
      at TypeScriptParserMixin.parseImport (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:14235:17)
      at TypeScriptParserMixin.parseImport (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:9353:26)
      at TypeScriptParserMixin.parseStatementContent (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12876:27)
      at TypeScriptParserMixin.parseStatementContent (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:9508:18)
      at TypeScriptParserMixin.parseStatementLike (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12767:17)
      at TypeScriptParserMixin.parseModuleItem (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12744:17)
      at TypeScriptParserMixin.parseBlockOrModuleBlockBody (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:13316:36)
      at TypeScriptParserMixin.parseBlockBody (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:13309:10)
      at TypeScriptParserMixin.parseProgram (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12622:10)
      at TypeScriptParserMixin.parseTopLevel (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:12612:25)
      at TypeScriptParserMixin.parse (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:14488:25)
      at TypeScriptParserMixin.parse (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:10126:18)
      at parse (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\parser\lib\index.js:14522:38)
      at parser (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\parser\index.js:41:34)
      at parser.next (<anonymous>)
      at normalizeFile (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\transformation\normalize-file.js:64:37)
      at normalizeFile.next (<anonymous>)
      at run (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\transformation\index.js:22:50)
      at run.next (<anonymous>)
      at transform (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\transform.js:22:33)
      at transform.next (<anonymous>)
      at step (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:261:32)
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:273:13
      at async.call.result.err.err (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:223:11)
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:189:28
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\@babel\core\lib\gensync-utils\async.js:67:7
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:113:33
      at step (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:287:14)
      at c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:273:13
      at async.call.result.err.err (c:\Users\anmol\OneDrive\Desktop\CRM - Copy\frontend\node_modules\gensync\index.js:223:11)