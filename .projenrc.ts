import {
  GithubCredentials,
  PulumiEscSetup,
  TypeScriptProject,
} from '@hallcor/pulumi-projen-project-types';
import { AiInstructions, Project, TextFile } from 'projen';
import {
  NodePackageManager,
  UpgradeDependenciesSchedule,
} from 'projen/lib/javascript';
const project = new TypeScriptProject({
  defaultReleaseBranch: 'main',
  release: false,
  devDeps: ['@hallcor/pulumi-projen-project-types'],
  name: '@hallcor/pulumi-aws-overlays',
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

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});

const projenProject = Project.of(project);
new TextFile(project, 'INSTRUCTIONS.md', {
  lines: [
    AiInstructions.projen(projenProject),
    AiInstructions.bestPractices(projenProject),
  ],
});
project.synth();
