import {
  GithubCredentials,
  PulumiEscSetup,
  TypeScriptProject,
} from '@hallcor/pulumi-projen-project-types';
import { AiInstructions, Project, TextFile } from 'projen';
import {
  NodePackageManager,
  NpmAccess,
  UpgradeDependenciesSchedule,
} from 'projen/lib/javascript';
const project = new TypeScriptProject({
  defaultReleaseBranch: 'main',
  repository: 'https://github.com/corymhall/pulumi-aws-overlays',
  authorEmail: '43035978+corymhall@users.noreply.github.com',
  authorName: 'corymhall',
  npmTrustedPublishing: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  devDeps: [
    '@hallcor/pulumi-projen-project-types',
    '@pulumi/pulumi',
    '@pulumi/aws',
  ],
  peerDeps: ['@pulumi/pulumi', '@pulumi/aws'],
  name: '@hallcor/pulumi-aws-overlays',
  description:
    'Overlay library for @pulumi/aws with convenience methods for event subscriptions',
  projenrcTs: true,
  packageManager: NodePackageManager.NPM,
  depsUpgradeOptions: {
    workflowOptions: {
      branches: ['main'],
      labels: ['auto-approve'],
      schedule: UpgradeDependenciesSchedule.WEEKLY,
    },
  },
  autoApproveOptions: {
    label: 'auto-approve',
    allowedUsernames: ['corymhall', 'hallcor-projen-app[bot]'],
  },
  projenCredentials: GithubCredentials.fromApp({
    pulumiEscSetup: PulumiEscSetup.fromOidcAuth({
      environment: 'github/public',
      organization: 'corymhall',
    }),
  }),
});

const projenProject = Project.of(project);
new TextFile(project, 'INSTRUCTIONS.md', {
  lines: [
    AiInstructions.projen(projenProject),
    AiInstructions.bestPractices(projenProject),
  ],
});
project.synth();
