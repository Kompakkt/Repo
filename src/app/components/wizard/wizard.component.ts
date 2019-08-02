import { Component, AfterViewInit } from '@angular/core';

import { UploadHandlerService } from '../../services/upload-handler.service';
import { UuidService } from '../../services/uuid.service';
import { baseAddress, baseExternalId, baseExternalLink, baseDimension, baseCreation, baseInstitution, basePerson, baseEntity, baseDigital, basePhysical, basePlace } from '../metadata/base-objects';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { IEntity, IFile } from '../../interfaces';

@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss'],
})
export class WizardComponent implements AfterViewInit {

  public UploadResult: any | undefined = JSON.parse(`{"status":"ok","files":[{"file_name":"Maske-Raw_small.babylon","file_link":"uploads/model/5d4364fc9f17e8add6941bd4/Maske-Raw_small.babylon","file_size":7892666,"file_format":".babylon"}]}`);
  public SettingsResult: any | undefined = JSON.parse(`{"preview":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAADhCAYAAADmtuMcAAAgAElEQVR4Xu2dB5xkZZX2T3eF7q6uzjlPT845wURyBkEFFFlF4TO7ZldRMa0Z0/oZ1sCqCLqiIoIwoICkYWBgcp7pnHN1V8fq8P3PO+zvt/ut+JOihpnhntptZ+iue+u+z+15n3vOc85zksRehoAhYAgYAoZAHAgkxXGMHWIIGAKGgCFgCIgRiP0SGAKGgCFgCMSFgBFIXLDZQYaAIWAIGAJGIPY7YAgYAoaAIRAXAkYgccFmBxkChoAhYAgYgdjvgCFgCBgChkBcCBiBxAWbHWQIGAKGgCFgBGK/A4aAIWAIGAJxIZC0YsWKqbiOtIMMAUPAEDAEPI2AEYinb78t3hAwBAyB+BEwAokfOzvSEDAEDAFPI2AE4unbb4s3BAwBQyB+BIxA4sfOjjQEDAFDwNMIGIF4+vbb4g0BQ8AQiB8BI5D4sbMjDQFDwBDwNAJGIJ6+/bZ4Q8AQMATiR8AIJH7s7EhDwBAwBDyNgBGIp2+/Ld4QMAQMgfgRMAKJHzs70hAwBAwBTyNgBOLp22+LNwQMAUMgfgSMQOLHzo40BAwBQ8DTCBiBePr22+INAUPAEIgfASOQ+LGzIw0BQ8AQ8DQCRiCevv22eEPAEDAE4kfACCR+7OxIQ8AQMAQ8jYARiKdvvy3eEDAEDIH4ETACiR87O9IQMAQMAU8jYATi6dtvizcEDAFDIH4EjEDix86ONAQMAUPA0wgYgXj69tviDQFDwBCIHwEjkPixsyMNAUPAEPA0AkYgnr79tnhDwBAwBOJHwAgkfuzsSEPAEDAEPI2AEYinb78t3hAwBAyB+BEwAokfOzvSEDAEDAFPI2AE4unbb4s3BAwBQyB+BIxA4sfOjjQEDAFDwNMIGIF4+vbb4g0BQ8AQiB8BI5D4sbMjDQFDwBDwNAJGIJ6+/bZ4Q8AQMATiR8AIJH7s7EhDwBAwBDyNgBGIp2+/Ld4QMAQMgfgRMAKJHzs70hAwBAwBTyNgBOLp22+LNwQMAUMgfgSMQOLHzo40BAwBQ8DTCBiBePr22+INAUPAEIgfASOQ+LGzIw0BQ8AQ8DQCRiCevv22eEPAEDAE4kfACCR+7OxIQ8AQMAQ8jYARiKdvvy3eEDAEDIH4ETACiR87O9IQMAQMAU8jYATi6dtvizcEDAFDIH4EjEDix86ONAQMAUPA0wgYgXj69tviDQFDwBCIHwEjkPixsyMNAUPAEPA0AkYgnr79tnhDwBAwBOJHwAgkfuzsSEPAEDAEPI2AEYinb78t3hAwBAyB+BEwAokfOzvSEDAEDAFPI2AE4unbb4s3BAwBQyB+BIxA4sfOjjQEDAFDwNMIGIF4+vbb4g0BQ8AQiB8BI5D4sbMjDQFDwBDwNAJGIJ6+/bZ4Q8AQMATiR8AIJH7s7EhDwBAwBDyNgBGIp2+/Lf5URSApmSubnBK/zyexiUmRqSmRpKRT9XLtujyKgBGIR2+8LfvUQ0D5YTw2BnHEZHJyQpIhj2S+6UtOhjuSZGJyku/54RUfZKIMYy9D4OQiYARycvG3TzcEHAIT4zGCjCEIZBLCSBI/BBEjAlGi8MEVfr9fAn6fI5LYlF/GR0ckOZBm6BkCJxUBI5CTCr99uCFwHIHurg6ZPWuWtDTV8F/J4g8QdfBnbJz0lZDKgjz0y5fsIzqBcCbGYZWQIxR7GQInCwEjkJOFvH2uIQACuRkp0tDSJlNJpKumJly0oWkrlTz8QdJWMTJaqoH4kiTAD50UMpUkaaE0GZvkzZbKst+jk4iAEchJBN8+2tsIxMbGZHpZjhyub4EYpog2pog6JiWV6EM5A+lDAgG/IxR/ICCjozGZGBuXJCUTUlq+YEgmIBN7GQInCwEjkJOFvH2upxGYIg/lmxqXVUtnSU1jkzS39sj4pEYeUySuEMtfqMJKJm0VhERysjLAyy89kX4ZGUb/gDcCKSmwTApBiAnqnv5lOomLNwI5ieDbR3sUgalJ9AzSV5npkhZIkkh/VDp6oxDIpKSlpUlmZqb0dHWStdLKqwmiEtVAguIjhTU8PCbjCO7JkIYfYvH7IRH9spchcBIQMAI5CaDbR3oXgSCpqPHRYcTvSRkYGJKMjDQZiA6jZYhs2LBBYmOjpK18smDhYvnRD39AHwjxCFHJxISmt6b4+ySaCH/n/cmwkN8XEH9q2LuA2spPKgJGICcVfvtwLyHgo6/jtZdfIM9t3yt9ve3S2z9EymoM7UPkNVdeIZ+4+RbZt2+PfPQjH5T+SK9EomOkucbQO9BEVBRRwRwCgT9c9dUkFVo+TXGlhekPCXgJSlvrKYKAEcgpciPsMl6dCIxPUFnFxl+QnydFBTlSXTVLDh/eK/0DA6Sk/NLZHZHUFJ+sPWOdvP2d7yQq6Zfv/dt35LHHn3CRyEB0RFIC6CIqevD/GoloaquoqEhaWlq1Wd31iKSGs1+dANqqTmkEjEBO6dtjF3c6IpCdkS6hgFZT+aQwN1uURKKDIzIyFpPegWEZHJmQlCDi99Sw5OblSj8ayNy5s6W+vkkqq2fJU09vQxtJlrQUv0yND0vf4JgMj4xAODCIlvCikyxevFiee+55KrNGncVJSlo6Zb/WWHg6/r6cztdsBHI63z279pOGgG7uZUW5Ts8Yik3JWGxCinJCMru6VDJTVfyGAOjV0CLbMYgjxtc4KScVyrv6otLV0y+9kahE0EGUYFTbGBmhTJefq/eVn+hERfMgREOWSkb4nDH0Ed4mBQV50tPbT/f6KEK6z0UlQgVXOCff/LJO2m+ENz/YCMSb991W/RIR8JNCKi/KlOxwmhQX5EouD/sD0UFIgQ09N1NG+Yv2ZOjGH6S8Ni0liOR9vCx3ijyTltqOj0+4KGSCP5UoBoeJRohMevoozeX7SjT9g8MySn/I8MgYGsgIxJLEsT4JBP00FRJtUOLro+kQWV2ys/ncsQkZHUJLIQoJZeWR6oJt7GUIvEIIGIG8QkDbx5y+CGRlZsiq6gzJyMqV+oY2WTC3yonZuvlr+imcGSKtFELQ9ktmRqYzRBwhWkhLTZcUJZO0VOxHjluSKImMQzZjkERfZEBdS6SzsxchPUa/BxVVRBRjqOpt7Z3S29sr9a2I6UMaoSgR0ZCejMmiH1LhwLff+BbZsuUhaW1r5/xTkpqeKcFUS2Odvr9pp9+VG4GcfvfMrvgVRCA3N1dKQ8kyd0aBI4fsnAIIgyd/tIehoUH3NabpJcwNw5nZLhJID4UlnI4mQQpKBW61Hxnl51qFpX0dg5Ttqljuo4+jq7tPIhBJdnaWFOZlu5TVKGTS09MtBw8dk9qmNunoGYJofC4qGRzic9JTOOekTK+eJo2NDY5cguS5ppKDEs7KeQXRsY/yOgJGIF7/DbD1/00ECnKzZFZJDrpGmtv8C4uKJSOcIamQQ0FhMb0YEAGpo8FBNAwiikm6ygOBIBVTWk5LpBEbecGeZNIRiOoZ+jXBcT09PRBLgEqsqLR39kiICKUgPwcCQVPRn/dFENjHpb6xRXYfrHWkQW+6S3sNDw1LFK1keGRUQqFUPhOdBCJSfUVTaFm5BWawaL/TrxgCRiCvGNT2QacDAhXFuVKSHZKi/GzJoVP86KHDrlFv7ZrlTqzWeRx5BcUI3qOOOLQ6aogNfmR0SHKy9el/UjKIPkaGozKGyD2Gd5XW2gaCQdc93t3d40gnJQiB9A868TyDFFkxZb55eXlOF2lpbZEkZoI0NrfJkboWGSBVpmW8SUmU8EJOPaTNVDfvQyNJpjJr3pyZcuxYncSwgk/NzHHkZC9D4JVAwAjklUDZPuOUQ0CjgbSUgHv6T0Xwzs1Mk5kVRTJIVVRNc6dsXjVHOto7ZM/eY7JizSpZsmiuNDc1SyoaQzgDomBDV5FcxW81RRxh408PhyCPMNHDlCOUkTHIJUr6CcFbU1kxtI0IXlaoGZDKJFqHdpZPSFl5pRRAHmrX3tFBg2FPh4TQTlrRQer5zO7IsKRBOD60j/7+funs6mUWSIorDU7LypIN69eht6TK7+++W5KD6Yj4poOccr9wr9ILMgJ5ld5YW9ZxBNxwJjbm9NSAVJfmyNxpRWzGRBFEGboBH6vvkN2Hm6W9f1RG0RgWTi+QZfMRySmLra+rk+KSTFm2crMTzQ8dPoxWUSAppLFcZRQpKxXHnQEiYrhGKMMYHWp1VDLRwhDppilSUUPoHWOx4yW6KqLr8Cj9c3JK01raFFgqOTk0AvLe9rZWNJRUGR4dk+6eiPT29UlzexfXHJTKqlJpb25ys0Pq2xDeJ32Qy6BMnzVDigoLZPfOXRKgKx12sdtvCLwiCBiBvCIw24e80giU5YXknHVLJJOZGhnpQec3VdsSkUMNHbJrf53kkZ7yYxHiogHSTgumF0tZSZ6kBtm80TZyw6Mywp8t3ROy+oz1rvS2s6vneFmt+k+RJtJy3Qw6wAP0hAyjZ0wlYb1OFW0m/lYBfj7E8b7kKWxLeujb6OFzjjcCjtPnoYSiukVGOCxFxSW8n14P0mHZWWE+f0w60UkGIaDu7m53XBACCQZ90t7aKM3NzdI/PCGRwZhEMVdM5rOigxBJdRXfx/7EF3yl4bbP8ygCRiAevfGvxmWrsH3RuoVSkpsqE1RJqdg8jmrQ2dFLeinsUlVpqUFJT0thkw/LOFFFV2cn5bT97meanhqItMvOw+3S2NbDf6dLblZIli6cJ+efvUEOHj7IUKcgm/8kEQg7/gsuuaH0NEgqU0JURw1GKc3l+yHKesfHx5xorhFDZ1eXE+OVNAI466qWorpIZkaG0z7GY8MSpsO8j2iln8ioq7tXopDeBOc4nmZLIQU2SoQzhPDeBcFE0EIGpX9kXHJy86QwP9eRTVtnn6sSm7I5Ia/GX/FTbk1GIKfcLbELeqkIaHpq4cxyKcqghJZKqYnxZAlRbjt7Rpn0tCFCEx3oZq0/U31CjQknJkktUYI7wpdWOY0jdNfUNchDzxxByB5DEM92KacQhHPGstnyvnfeKM9se0r8hBjaZT44jIgOOWjZbS7iufZ6pASTHTkkqT6iGge9IDEijY7ODukjFaV/dyOjSHWlh9MlH+JQItPoIjY25EqDNcoZoJkwyjVp97qeNwSxpKWmuD6T6EAfVVx9lPb2YMaIBXwSJJSdJzt27JQzls5hOFWHjJAac9GOvQyBE4yAEcgJBthOf+IQSCWlM604W1bPLacPA1dbxr/mlE+Xnu5OWTx/plRVlkIm6BOkeDo7OmWgPyKxEXo20CB0g9UNvbW1zfVxDA0OyC+27JDZC5dI/aGDzip9mIghnahES3q//bmPyP6D+x35JGGOODI6TvPfBFFKCmmnLLfJKxEk0+uhvoeqvahluzYEdhDlRLVbXGeZQ1QpNAsWFNBPgtWJJtFUbI8xuzaCnqGlwePYogwzfTDEz1V816hpiv4RTXHFaFKMRqPOyberp5cBUwNu5G2UtNfyhdNdl/pT+5skheuylyFwohEwAjnRCNv5E46AWpnnhFNl/aJSSUbsHsbOozCvUIKZ+Uz2a5ASXG9XrliCXtBKT0WvlFdUk4rSJr2g+Ek1RXHCbWuok/2HD0gD42THxkcwOZyQ3Ueb0bFHZf7yFZJJP0cWTYR/uOdeNz7267f8s6SimXR2dbv0k27yMSIJbQBMCaQ6MTyVaMHVZqlxLkQyqroJ5NHNcKhR9AztNlcTxWyiGyUHnYHeTMlufkG+dPeSkiKySIOwVF/RaEMrxVIQR5Q0ujiH6jUDA4PoOVGnxQxqpAKpaJ9JbnZYMqkCy8e88Uh9mxxr01SavQyBE4uAEciJxdfOnmAE0iCOq9fNkcYWNAo28ukzqtmAs2XfoaOycMkqqpgaXcQxc3o1YnRUmppaJcDTuG7MBXn61J8uGdm5EMUYg/z8su3ZHfLEo3+WO7Y8I4sXzJZRnG+FjV0lhAn0jra2NtJWAbn2qgvl6os2yYHDh3i6R2OZSCbSON7cp5bqQ1RfZWYiiBcWyoIly2Tnzudx162TQcpuNdqZIt2l1WBqsKiahmolSgSaVutCu2hqbicqyeezkolqUnkf0QzXMEa/STdd6aNEWNr7MTJC5EH3upKoEod2oav/VQbkodqOajmTRCv3PX3Epb3sZQicSASMQE4kunbuhCKQz1P2lRsXuW7vKTZ5NShUN9swOkKATb5q5mwa+4ZcRKLpoerKCqqUhuTokSM8uyfzviw2WqzWIRPVRLRXQ1NQN733Y4jm/UQGGRLi54QPx2uzIIcoOgOBgMyhsfDd732z6uN4T7USzeBv9QJxjLOzq57iYyMvLCzi3AE8s+pdz4ZamjhbEyKKUIgNns8d4Pvo8K4ZsX8wSg/J8YZD/blGOzpAStNcY0QeQ/SXKFFoRKNd6EokWsGl0Yf2oPj5vuKg3ehhyn/1T20u3EGlWfewrsJehsCJQ8AI5MRha2dOEALzpxU6kbwkP9PZpqt2oZbnamaYrGmelFSewgOyeCllu5lZPLH38bQ+JflUJi1ZvQFNY5ccPXiQY0TSqXryqbUIG7RGECn89yc/frM09IwxgwN+CIbcVWtKqq21kwbCxfSFTJPde/bLe//pSsnCSr0/EnEGhgEioDG1aIdA1EBR01oj6CYqoqsmEgqFiFY04sDfaoSKKYhDez9i2mgIGQxDDmqqqH0kMbratfRXRXu9riiEpESiEYWSh2ovqqGocD8EKWr3ez8RjPauKIm4lBdElwp5pdIg2dLRLXsbIwm6A3YaQ+BvI2AEYr8ZpyQCWkM0o7xQ1i+udhuwVjJpCkeb9WJEBmE6vlVPiKoXFZtqMlHDa17/Omcn0trSTNVTxGkVC+YvlOLZS1zZbcuxvVJ/BCJRR1yE64zcfLfxfu+bt8oTu2vQIPqlqATTRMpyY5CBktL111wuc6YVyP79h6S2rl1ee8V5WKiPkP5Kk57Odm0hcZGAvnTQk6aW1IE3yMbvHHujVE319kEsfOaECvcabdC7QdQQIJL6rzST2qKogK7WKEoIWt6rkYz2dKhDr6ur4tx6bJSoRRsMtdRXLeA1avFzLq36SuXPFAhkiL6Qx/Y0MGTK0lin5C/4q+SijEBeJTfy1bSMdDbASzctlmQ21aHRQUcaqWmI1XRZh0nzBJNiPJUHj3d1kzYaIq0zPDQpF12wQXKyMp0dSEtLh4xDAOWlVVJONVaOppZCuWyoqXJoxxPYlLShcwTRKLrlrl/9p6w952L5yU9+jOg+QF9GPp8xDoFVyIUXrpOZlZny6988Ko2dA3LjpWskKSNPOqh+Kq+olCGiitbWZmloqMVksdTZuk9MjHNtkAobvo+oQiMNl3pi89c+kDB6RS5CuqbTlChHKN9tp0+kpbWDdYakpKQU88ZCR0Aul6b/w98nOa9GXxEiIDVk1CosTY0pGSmRKAlpR7z6bA0yq2T34QYhSfdq+tWwtZxiCBiBnGI3xOuXs5DejSvPWSl7DxyWutYuyWJeeEVFBampHDZXKpfo7HYT+kbwp0VDePbeBySHlM/573ub5FXNkf6eFulo65ADiOrqaJvLJq1DmlRzmLNgsazecLbkV8+TA9ufovGuU7ramuT+P90nHd0DlMT2SVV+CrYiqVJeViCh7ArSSyMSZP9+5PGjpKym5N3rZkhvdrEcbeqSmsZGBPksWbFiGekjrNl7u2WSD9LKL9UplDg0GvHpBXOOdLSQbAhO+z+mSEnpwKj8kjLJycshFcXnqCU7RBHTsl4dMAWxuDQX6bHjlilwEv+jkYaaMmpKLMraVEhXU0ZNhamArhFMH9rNAEL90Y5RRzD2MgROBAJGICcCVTvnS0Ygiy7uizaulYJMn3OfzULwnsJPyo1hYnMchSx0HkdRUYl860vfkpg64BKBvO6NV8q6s86SxpqDkk+Jbk+kQw4dPIop4oBr8ovS9NdBL0YO5a3ac5GdX4hWskwWrVkjB3fvoUqrXrY/u53GvF5p6+qTC9YWk/4ZRXAnOkiGfBqxIRkYkQoqvVZsXI+uEZa6owekhsFSU2z41TOnM6EwG+3BR4pK0Fn4HyxNdH6Udp47E0XEeh30lFdc7npV1AJFO9R1Xx+jL2WUng+1TdHmQxeSaB2wyv78qTNFlBi0z0WJQlNu40Qi2kHfQW+LTi/UaYgxfq4pLiUSnZ6o0dkgWslzR7tIb5m1yUv+hbQD/iEEjED+IZjsTScKAX2yXr14tly0ebVEeHLXx+w0RHHdSwfQN9SXKpPNPJmd94lHt0pXf58TmafGk+ScizdIKWmmYFq6e4Jv2P28jPFUnpyeITMWL5PS6TOdQaGW0O7ZtVt2QxitkERVWQlRw3KpqKqSJlJPtbW1snv/QdG5Tf7xqBTkBGSSbvbx4Unp7I3Kla+9TFavXCYtjfWSjLV7d0u9FBMV9Q9EKJ3FHoWvzIJymWAzV91C939NVU1xnUpiyiluQ0f01ibAftY5GO13uoxGGqpTqB4SdEJ4Mt9XHtH/0VJdpVC+iCy02sqHrqPNipM0HnaTxmpBzFfdRAlnCLyUbAIukhFnDf/I87WSRZRkL0PgRCBgBHIiULVz/kMIZKEFXHHuGVKam4LQHKF0VQXjoBv1Ojw0KjpKdgg9Y+/2fVLbwRCmcIpk5YdkaMInb7zyYkwMtXGPfgw21WGe5Otr66SPAU1nbjxDcvGHSncbJ5swNupus21plQf+8pjb6NevXiQr15xB/0WTHINAdEBTNzYiR+sQ69EvRimtzaWvY/WK+XLORZdheKjluX7p7miVVohEiSJANFI2bQYkVkXn+Lg01+w7nmKilFi73kewRFHBvpf1qLHiGBVT2k2upcZDCOEabaQgxqfSm5KSGnLd5oqBWrOnuK7242RxXAPROerMXdch7C9EIvpZKrz3knpzExIhDMVOCUzTWDpDZMuT+5mVnmVprH/oN9Le9FIRMAJ5qYjZ+xOCwJI51XLtJRvkMPYgWvGkpoG6gUaw6EijszvGBrz96T0So7oqSldflN2WbL7MzEyR6QxQesvbrmM+R5PbW9M0ddXdRVqnHevECckmGsjBrj2dyCSJcly1D9EIpbm1XfYRadTW1csGBkTNmbuQ6IDZ5KS7BolsOtuZxUFlk3aFh2gyXLx4rqRlF0k4u1CyQ8c707V8WJ/uOxoP47eVJ4tXbZKCyrkyOdImu7c+LhMQWRfzOvqpglLXXNcjQpOhHpOmZEETodNE1Nqd0ESTVWraqEL6uE4chFzUFFIbH5VIlFA1qtBy3hRKfFVM13TeKO9TSxVtThwDu6jOCaF8+VhDq7RTTTZ3eoWrNDtY2yGDVH8FITx7GQKJRsAIJNGI2vn+LgK6KX7whtdKX3cz1UutpHQwMoRAAny/OCVZtj62U2MKifHVyWbdjtusNg2O0GiXgYiewka/APK57qY3kkLqZ4NNcZu0+kHt2LWTJ/xhOWvjBjZqmvaoaNI55ONEINrY18hwpn4s0POITM6+4GKJRnpcz4Yrk9W8ERu1Fj1pZ3dHU4N0kN6qmDlH2rFiZ492Dr+ZaclSMns2qbJeNBC/rDpjs2QUT5OarX9y5oYaSdU3Njt9Qjf/MKK5zurwucgCmxL1bSdE0JSWG4Wrxo6I5Gr33kE6Sstzs5lrrnqGEooSTNCV6GrpLyT0QnSiPSZa7aWEoiTZDwnq+h56cgeayKTcdONNcucdt3O+CARL7wvXqs2Px/UVexkCiUHACCQxONpZ/gEEZjAQ6Q2XbpBoD2W2bd1s0m0yq6hSnn/0UWllOl8Gw5taeqkqkqD0ko7pau+WID0ZuqvPmE6qKDMkW3cfkYyhHvn8Fz/sfKAG2LRD9ITUNrXI1md3y9WXnytzZkxDWxgVXwpNgYjQmgpKCWUgZIfQNujuHmTAk+vw1s2bPgpIyM0r10FP9Gkk+xHf2ZCHqWJqrGukr6RdqsrLiYDQKDBIXH3WRpkYHpTe3i6ZNXum9NPnEaH8V0mwhSmGhw/X0JFeSLVVrlTOmEGKKuQmDDqbERoJ+7AuGVRjR3y3NOryE4EEIJeudmag79zp0m3BtAwXQalgrqSmqS1tUlRNKPSCgWM2PS8+mg2VSCjylaPMUN+2cw/zR6JSXJjPZMM+IpoxPLwgGtY1MEn0A4kErDfkH/httbf8IwgYgfwjKNl7XhYCVaVFsnHtckkT5lvwVL1qyVx5+slt8shdf5YIKaphIouCvKC8/2Oflne996OuYVCfzi+++FK58Pxz5Gtf+Yok45ibTGqnnoqo8FRM3veOaxCHs6WtgxQNnld1DIpKRje44brXO5+pCQhE7UXG0Q00otFqKNUtlI00RaRKtTYf6gYcJcXkrNZ1I+Zn2hU+QCXWBEaNs+fOk90PbZH8nBzZtnu/zFi4UDZfeKEkYcCoOvehfftlJwL9KJ93xhlr2cZ9aB+4+NIRn0flVx5VX0oa6nvlp8u9P9IrwxBYOlGBRjqR3g7XcZ5FhVk6xQIR3ndw/wFSaV0yxOavqS/tJdHph0G+BlmTlvFqdZZazmvnvZpEahpLU2W7du+VLuxdnt91gJ6YsCOfdEqhc1OT0I6SpBWCTg9nukZIexkCLxcBI5CXi6Ad/6IIaPXU5ZvW0h09Lp3NrVJHxLF50xocZfGdygzKU39+Rh6v6WTTZaxrYZ6kMd1vPxuybqxqWJjHBqgpmlTy/Rh6oG4kyW4GJmUxTfDNF6yWylkzpbmlUQYQvFtbu2Xd2pWShQnh8GCfszcpKC2l8ZCog3NoJ3iEzVv1BFWvnTWIpo+0nJbNWOeaa0WUluFqVZPOK0/PyJayqmnShci+98nHJTU/X6647k2OeDoxbdy94znpQlcZ4TwbN20WHcPR29uPuB+U4qJiySkoIp0kcmT/Xiesq+ahTY75BYWuHDmNqEjFbhXIldDU4ys5aQIyGnYDqDQNptqIXo+W+h6fSpiCw28XwnnEVW1VVpSCXREVX7gSD0eluQ3ioTfk8e07IU8CD1Otu5gAACAASURBVNJjxURul5y/UXbs3C07cBzOQVSfIspSfzB7GQIvBwEjkJeDnh37ogjk5WTJDVdslJ6udmdf3s7GduTgMSmuLGFzDzp7krTApPzyzsekEQLQ+eEL55IOohIqK5wmY5Sk+km76KAnZw+iQ5fQSnYyHzyd6q2bNq+U9KpC+j4G6eKOOGPDTavmOUuPEA63uaSQUtKz0S54itcIBJIY5ul9dHjAfW8CXUSb7nTAk7rejlMWO8FGrpVSw1RPTU2pwy12KRBQFhFS487nxE+11Uw0EY0qDh3aI3v+eLcMpOdISrRHPvXrv8j3v/QJ/LmiMn3aNMmAfFIzcqSXaYR9fd2kxohw+DzVILTqSqOkJIoDNJ2UQ3QThDADfkweA3qd+jN6Q9Bz2ulPiTIQS0fq6nyS470iyS7a0JSb2r1nYVWvUYpGXOqPVd/QIvXMOVHDxYKCYlk2t0Iuv/wi+c63vytHWtX+RCcmUjoMPvYyBF4OAkYgLwc9O/ZvIqDW4m+/9mJpPnYQAZeNUUXeQUppuyMIvS0yraqcjTmNFo1hTA5r5HDLkNQiIIdI45TQkJfBdL5BHQTFpj/J034yKZ4kSCeMTlCHlXkEAlhRmC1zV86RQRroOnoGZdXCuZJPE6KOeNUn/PlLz8DSvdyNiG1qbEV8DsmSNetEh4/3HNsjdTU1lPAiqjPONg17FD8b+wjnUr1EN+wRiCTM9UyycV923Vtl51/+gM7SS0lsWOaQxnrmnt+4LvC9h4/JckT9m778PfnXT37IRScrli5lk2bWR3ODS2kV5lNSDBkNUG47TEQwweeMsvnrdEPtDXFzSogmMiCCouIyIqxsBl9R9kuarLOz1TkG19c3Hp+xzvsGX9B+lDRUhFcvLHXhHaI6K8J6hklxtRG9tHYxbIroawHd/UX5ObKfEuWWlhb0Hk3lMSseLzB7GQIvBwEjkJeDnh37NxG48rwzZVoBT9nO9K+XTY6n+lHKT3kAV0FaeLovxygxiwqlToTj7X/dIy2kVHqw59CcfsFkTHIn0BiwLxlmgySb5MR01Ss6xzAOxAsrh3TUos2LSV+pXhGTdSsXSCZ5/ggDl1as3SDrL7/hhWtDPG46IBnlSymjGpYjzz0qh5k4qA19+lSvc9BT6O/Qqijt6lZLEu0tGWaTV/E7g8hAbdI7mT+O762ks1FPmz1Xfv/NL0g0Bc0CH6yl686Qt3zgE3Lbd291TsDz5sx30cCzzz8vV1x2qZSWlWEG2U0UplEBY2i1+oqQSSMS7TBX4hqDFLQaKw/xu7CoFD+sCmmqP0wqjWmJLxBDGBJqam6h6z2FSGPQzXKPEUlpWkttUEa0CIC8lc45qaltcilDLeOCfl2Kyw+RjzPHRAvOlDDTICrrUrd/xC8HASOQl4OeHfu/EMih+e79N13jqp1amPo3yabYR8XRKPoCWxvVV4jebPIF6Amp+KcvXTBDjhw4JI88skcq15wpSxbOl9t+9BMJYX9egO9VG4aHmm7x0z+hOX21KR9ks1+vEcimZdKAX5bO/1i1aLaUFecgTpNyyi+TzeeeJwPdHbITz6tGSCvJd9zRV3soyvGfyiNK0cFS2oA3QkVVEvYjPjbVAJpEkBSTagdJfgY7MW+9/tBeiCkqhRUz3TCoINrF87/5idT2DUsGm/KqczbLpW/7kPz2R19389JdVVhdjTv/2Zs2YF3CtUOE9Y1NkEgLGs0g5KHJMzQKNYyEDAaILpxZImRSSqd8TlaulJRS+UXxgDYQdtDA2NDQ4Dy2nF8WxKGz01WwjwGMNiyqYeOoI5QAa+6g/JgyZ83PYQmjpJgGNrp+/cwg69SqsbSwdanbP+P4ETACiR87O/JvILBoVoVcddlFrtqqj/TLFNFHD3n8Mc3fs5c1NnU4N9nBoZgsmF3JU36qTK8okJ//6HcSCWW5zXAITSQIAeWTwkliox2inFWnCiaR8mklhdXFhrskL1uue8fV8tT2PbJs+SpZuXQ5Gss2IgaetFOpTCK9U19bgxBO5/rIhEslqXxeVFgiBTzd+2lWJF/l5niMqC6C3qDTADNoFvTxM+0t0Wsf6aM3A9+pQICLx8YkxIZbUjZN7v/Rt+RQa4/MKsiQpeddKGdf+075w09vJYXFsCu2a+3rKC6vxJSx3BGFivc6oyRKSk01ETVJVB2Gvd1ZkGhl1ahWgEG0qvlUELWo3lEC2SkxaPpqeHRAjhw9TPQEAaHXpFIarGSg6ba2rn73vojzAAvI8wyU0nkoao0SZd67XkMa5JdKM2I37/WjtWjaLD0rz32evQyBeBAwAokHNTvmRRFYs7BaLqLMVauHRgb6XM9FFxVFutFN8SStjW19fVE3XS83M1OyczOkEk0kLZgkP/nxvdKLhqDlttqfUajd6aSChv3YeiBk+9AK1LqjKTLETPR0+c7n3iV/fWavzF6IT1V9jSyYWYxATrkvOkZ/dEjasTXxk+/PR1BXPSMtPYvoIMtpAMlsnurDpRv32HDEWYSk0CORg+gcoZmvuf6YFDChUEfKdpGmiva2S017r2QXlUka19Pd1ixHIRDtC3zb9ddIFc2FW594jHNo86LfOeGmkyIqKilxJboTL9itq1DfT0SmPSQjkIg2F2qeaQScBiHO5ADaENcV4MTZGErGYpQtU/IbQMMZI0Wl1V/Hao+5aYZKKmowqW69A6xXGxl1QuPgSEyO1re61FxeTq5LY2lUswjtRsuV//TAA648WKOTFPBQc0d7GQLxIGAEEg9qdsyLInDWGctk45mrnRA9STQR6euUNkpttZNan/iH6NmIRmnic/n/Scpdc12/w/KVi+VPP/udtPho/uN9ncwBn4/4nM9cjuepKkpDj/Cz2WpjXSA7T+YvWCjTA70yf90m+f5Pf8VGmSOryvNkHqW83WzQregN3YjIxcWFsmjZKjcHRJvwnL+U2qIn065IL8Qw6atRhj5pCig7r8g9sbfTIX/04C4poxS3na7yg0drpHmAkbOQxQAuwFpFNY/P/9S/flm+8NH3yeYNKySTcbs7nt/jejPUlVerwgYGeiQDHaeUVFQmZKJkpaShGkg0GpEuelhSKSZQI8UABQNKtGP0augUQ+1H0ahNGyJ1cFY+JcHaWR8bH6K5sR7L+H5nP69pvbysDKeH9PLVTdqqnkorJRPVjDSleO9998kPv/8DtJUCrqVUvvivX8TeHmdfPjMNPy/1FLOXIRAPAkYg8aBmx7woApvXLpPN69e6WRtO/yB91dHeDEkgipPD8vmpyEKQ1nSLytVqcz7JU/lFF5wnj/z8Tnk+EpNNF1wiv/zVnXLWmWdIOU/RTz3yoAyRVtKeCdU/VAdYtWGDFPrH5IZ338h7/8AmX0vJcLfccOnZ4qPPge4ON5dDI485c/CqmsJwkWhGmwVHsDlXW5AoUdAAliS5OdluXvoIqaFxrqWBOR+1+GyFSTEtWne2/IbrysaDaxDtoayyCIPFJXLV9e8jo5Utv7nt3yU4OSi5zPg4hDjvqqE4LgQ5jU+MSh9lyUUlxQy1qiY6oinEvdSqXVxT4QCOvlpOnEk0NgaxHD1W6/pDtI9F/bu0b0SJRM0hi6nQ0usL0CvSTZTURA/KIGtIJzrTMKOD9bfxdaiWY4h4ggzmSgW/T918s+zeu1sKIaGNmzfJu9/+dqIU8Ed4V/LQDn17GQLxIGAEEg9qdsyLInDJuZtk+aI5rv9hhEqn3r4e5+/U3z/gdIAc+kO0n6GTkl4/FU9rVq2Wbc9ulcryYlm9bJl8/rPflteywTUznW/n9u3yvjdeLb+/4w6p5el8/dqF8vC2gzJj7lzZffQIHdYh+eJH3yzVS1bLru27ZM3aMyWVzVWdbg8c3Oe6uUNEC4Vs4DoaVglE9QO1U+9ClH562w4n0G88a5Mb8qT2JQ2UGbd2tEkrliSXLV8kTxA9pSN6p+dkSBFP71k56Vi7L5EZq68BAz/mj/3yi29+VhYtWSDHDu+DDAJoGTQ/amUUmkMH43XV26oYLSOD/hQnNzibduaok26LgM+ozngnXZeL/qLu7W2QxgjlyFou1UrZreoilZXlzq8rJ68A3USbIruIQIhCsFDRQVsFkODRugbZwyyUmqbu4waOpMJystOlir6UfIoW1A7luje9SW7+xM2ufDkZMvejFaVgRmkvQyAeBIxA4kHNjnlRBM5dt1JWLJkvA6SgnKUIDXrN2Kir8aFag1Sjd7R19sr5F17kROsHH/wzqRt6QBgodc3VV8kn3/8ZGWB0bSeuuPPnzJL3X/cGObRzh/zsD/fwZM5EP+3iRmAuqJjmSn7bnv2L3PSxDxOdBGXJ+vPcjI3abVvk6I5tMpVbLINslBm45uaQDtOn/iFSO2r9fuwIEw/rG5hciGFiXpacf9kFzlermeFTKmofpL/j4rM3SCzaKqNT+GKNBSWVKqYQgv7KNeultn1YLnvtddJNZdfVr7lCbv3Xj0p3e5McwgdLmwN1DK9GP9mk1kbBoQkMpldPR89gdgmRGcVbTrzWKiut0FIXXh2HG4ZkBiGsdpyB1UVYIwlNT2lqLUg0EaJySo0U9bjOnoj7vtred+LHVUOqr6ahmcZK0lkQtvaZhHERLioucefU+evLli+jpwQLewg4mYvwk9ILooPYyxCIBwEjkHhQs2NeFIFNa5fKynmzeELucd3jbYjNmmbRWRXJiNfz+VnZtLkI5zPoAemUh/70B6nH+VaF3mtee4l896s/lDZKYSurZ8n2556T27/+ZcbPPitP7dwlh3GbLcLUUBvodh06LOvXb5Kd256Uj779Kpm1eLmsPf/16Cd+maKq6t+/8lm5/cHH5N1vudZtunkQiBuspA6/POH3YgfS2Noiz27fIemaVKJR8erXvQaNZpQSWITqmlquP006EexzgxG32ZN5k9Y+qrMC6fKVW78mM5hGGGWj3rdnp7QdfJ6qKHEWJEoIuvlnkBbLhrzUqqQNAlGrkXwiiBTeqM1/GlHouNlJRyTH9Q4lHO1P0Uo1jW5UD1FvMC3X1RkjkxQipCF6T5EOVD1GbV/UtTfCzw4crZdm5qZoFZsSTwCcFi9dIHsZpOUqriAe7QGZNq1ajhw55Ewq1a04pGI9uo29DIGXioARyEtFzN7/dxHYuGqxzJ9W7Kp9tL9C8/valDfMBqjVPhs3rcfio1gyceG951e/kJLcTHnwLw8RTWTIzbd8Vr7xmc9LRlm1fOATn5Jf/fr3snrpfEnqaJKntz4t//7bP8iSZdrlHZMjdGb7qNZSsb4ylCRf+tqnpXoRXlgFVTIa6ZaH7r1PPvf1b4mP9M7N7/4nROhiyS+mSgtPqfraIy6FVFfPhktvxjM7DsjcUizeL7pQLrzqern/dz+je71Zdu05wBz1hdJZtxe/q5g8e3gAK/h01pEkTz+zX6659g1yxWuuRDx/XnY+9bB85EPvlmMHd0CaXa6UV/tBNIWmRoiqZ3QSrWjlk1ZOKblqqbDau+vQqHEqrHqZqa5d50n8nxYLaCSkg6ocyXC9WnWlRJHCurWSTPFUt91u0lh9pOXa8Alr6sCskc9yli6u6EBH3QqRE53wWOHrcQUFeS51pqTt4/NTUjMgKSvltX/aLx0BI5CXjpkd8XcQOPfM5VKcneJMDGMqWOvMbzY5Fb79bJpnbd4gP/jRz2XnvhoJoz8UYnuSRqVQVmaqfO7bP5VvfeazcujIEfni//2hfOqTn6HpL09u/cJn5Hsf+qB8f8vDctZ55xNJZDJnI0d+duedUkGZbCNmh9dfuVbWrj+X9NKZpJGOSAcay2GeyH/8i1/KVz/9Qdx0s2gEnOEE9OaaYzj3MvODNJF2pW9l4uHr1syXw4y7/dy3f4TdR5Pcc+dP3QyRgrIq2YEW09Q5IN1EI8m6MbM2fWkX+TJ0m2kYLv4Jwvre5z9E1zwRTEMjKSNSUpBHkMhGGwkDpNjUwHECYV3tTsbRPAY0NUWUoEOmtLFQTRRVVNfOcsXLfWmnug6QIqpQrUT1owy68nUMrhYVNOMN1sEAqxjt+jV0nkeJSjRXV0LF1RiivWpQZ55xhvz18ScR5tE7mH0S5rpGsYtxjsSksJJwAUhOtoFT9g/7pSNgBPLSMbMj/g4Cl25eJTMripw4G6ObfIDc+/FqJzyf2Civwc22k5TV7Xf86vhwI3SRYJC5F7EBee/7/1nuvuMeueueeyUWzpEu5ma86Q1Xy1du+ZRs+c6t8qnbfinVcxfIDTe+DWE6U77w9W/L/IWzpf5IjUR3PSvXvOd69I581/8xRX2rDoMtRkBfsGiBRHmSD9H5TtM69Vk+aaFTXA0U9x84IA8/tk3e+boLZPu+g/LG93xEZi5YIZGuFrn79h/KL371e5k1Z55sfW4flUuM2f3/5ourSeKSRUtkOyRzLRYul73+Sqk/vIu+jBHXD+LXTZuKrBC9HKo3aD5qjEmBunl3ObGcXhAISaMUjUY0Ckl2A6fGnXtvDBLQ9FYUHPV7OgBLZ5270l+O0bXWN9Gj0tzpopUQjZmaoqqjiZJJIWpeD0kws50qL40IfXxuDJNKTbHpZEQ3Y53eFU2F2csQeKkIGIG8VMTs/X8XgQs2rkBEn0cfAxsU25eWqh45ctRVBWkefjYVVG/7wGflNz++1dmG9NG3sP1ZnG79U7J81TKJNLXKnb9/WN76wQ/KLjb0S0grzaPH4o4vf1621LTIgiVL5GOfuUV27dghD//1MXnw0cectcds/J9uePc10t6t/RD4TZHmymLgUsuRg3L1W27ACgVfK7ykeHRns8QSndLimsMHEMHb+ZxjUp46KW1ESh/89BchqSVujdqL8R/f+bzUtQ3K3fc+wHY8idD9P+doaEPk5k2b5K7f/NZt3rd+8gNSgs/XME2UfWgYAaIu7aDXfosQ1U5ql6KTDZUUdD66WsxrE6NGFFpSq3/X3hS1UlEtRO3mtYFQNSR1ER7WY910Qp15nkwpbxeGjo3SMzDsUlvvfOvVcsdv73PDp8L0mHRTRq1TDDUFdsXll8usWbPk//7bd509ikaIqsMESGHZpEL7hx0PAkYg8aBmx7woAutWzJdNZ66itwA/KeZyRPooN2XMayf9EOrDlIR3x7p1Z9LUVuK6taPk759++lk3nW8WrrZF+Ed96xs/la/+7HZ54IEH5frr3yhNjz0sP/zmN2SU/ogMtIwf/MdtsnXrUzyVD8mHP/xhxlQlyxqmEK4uTpfyjWspg+1xFVea5G9nDskG/KhKqqrRBGhGJIWTEs6jybBTulvr5DFIaIrS3jG0gorp0+TGj3xB0rBi/69Xf2+n3PimN0hDe4Q2FrUj+Z9L1yf4JQsXyyMP/5mUXEAKiVC+ioCfkjTqNm+1dNGKLBW9NQJLAZcpLdsl8tB0VYTqqSEIY0o3ciIVjRS0ek2bDpVMVBvRLn4lEiU07cRXkV6jEyXl50gFNrbp/JOgvOtd75SHH7wHF17+mwjl8ssuwXaFqjd14OW/1Tbl0Uf+IseOHZOKiiqGcNW5KMaXArHayxCIAwEjkDhAs0NeHIEVmBpedNZ699Q9NdpP+W4v4u8Iflh9LpevbrnJ7O43vPl60kcHZZQn+AOH6xGHezBYzJJ502bLt777U1l3+VVymMhlBWWn/Xt3yB4qsZIgkMLSMvkx2sdh7NjLK8pkw9ozpAN9oJxUVeVAt9x0ywdw6KVJDrG4q6eTcbP4QPE0v3LjWVRF4bxLqj9IOqkNW5KH/rRF2mgaLCvIlipGz17xhjdJHp+fjLEiCv3xRTKXY9uW/5T3fPxrbPJ8/7/NYFIhXsfKNlEOPEyH/UxmnXQwTvYd179ezqYfhsHpzm5+jMbCKCSqjrjprmQWIlICoE9mgGo1Te/pUC1NOKnoruW2Ouvjv0wTtRBBIxeNPvqozhoGx0HIY8/hBjlc10b0FpQf/+j7csftt0sNhQEaac1htkpfTxfNh6VoQocQzguchYoWHRw8uB9i0k70442Eap9iL0MgHgSMQOJBzY55UQT0Cfqf3/JalxKJ4e8U4SlbNzzVCrShsIcn7j5KX0tKiuTM1aukgWqq3fuPuLx+KQ67s6ZXy223/U7SMCxspKehoCBfsnpbeVqPSpi+jyym733j+z+U4mlVEESPfPWTN8tvH31cLrvkUhl69nGccddIOucup2tb0zhataQzyhtJjS1ZMBu3W6xB6CDfSuSRQbSQhpC/et062Xj+hVI2e7kMdDUxq71eqheudGmixoPPkWbrlLe+6+PYhAzIeiYP7t+/BxfbkLRxTh1V62PzX7Wo2vV2HGG0ruAgfCfOvMGpYWmjmRGRgRnoA65ZULUQF1WMTToxvhdjxW5Kip3TJCmpZLQjtbnXLvFk56KLuO58rwYdEUeJQFqotNp/pI7ejyjC/qBcd921zD1PltLyClm5aqVUVFbJgw/8Ub75jW85ourp7XUzVYJYlygD+mkgVMLyIeb7acZMhoDsZQjEg4ARSDyo2TF/F4EPvI0NjVRRP2WjWpKqFh2ar1eTwlYqn9TzSUXh8zafib17F13jNc6bqTA/g/TXCvnGV26THp6KM8OpEMew5PMkH2CDTaJstYDU15e//g2ZvXGDtFJBpaW41914k3zjm9+Wf/nkJ+VNiyukfM0KzlVIkx1zwIlwOpjOp53lLWz4BegEw8wbmSD1lJmbI4uWr5Qlq9fJnGVnujXtfGKL1OJ4qxYgpaXTGFM7QRqsTj7+he9KdnoyHfAdTnxWN0KNLHKIQOZWZkk6LrcxZnc0d1I0MJYslzPL/XVXXSzjA00QSpqbZa6uuFpGmwQWA/0MhyICGKD7fYrrGUEA16gtiU09n56VDM47SnPhKJGNdpqrLYwSQW9kgO7zqGzbeVBqW3AJ5hwXX3guhQILKUZIpWighMqyvbL9GWbO//UJ1/2uKTL9TJ3KqP0sisskeGoFlo4RtpchEC8CRiDxImfHvSgC565bLivnV1NgRdUTYrZqEbpZ6hyMLixOdChSL5FBeUkBT+ITlO3Wu6fvstI8ur/XyGc+9yOZoEx3gM49qm0lb2xQUtjshqisysstkI999COy8epr5MkH7iNFUyTvu+Gt8jhTB9WOZN7ksFx/83tdw6A6sGdm5zvTwhrSOA3N7VLAPPUgYndWXr5MZ/BTKCMsZ13+RvcUPkEK7L577sJMscUNfCqiXyIbi5CHH31Y7n94uxRm+fDEYlDWaLIbEDWhEUWaD7Ik/USElc48dn2yj4z40EpS5fu3flZClCi3N9W4aGictU4wOF3nr3diEa/f66Irv6ysGOGcxj90CtQS12Hvh8DUA0t1Dy1ZVlG9g6mNqoHsB6/nEf4HBkdkWkUhvlsMxKIwoLiokOjoAL0uUZcm7GdeiBoxlpVVMGDqmCv7VSNJxVq1GZ357kMDsZchEC8CRiDxImfHvSgCGVitf+ym17PpIfaqKy1PzVqBpSmhISw4mhvrXJd1jHJW19DX0ObcayvKi2TR3Gr5xU/vkdxZ83HHxaDwwH4JMxfER+opisdVOvM4rrj0Etl89rnyFzb26qoK+TWayNN4QE2iHyxgP7zuvW8hciBiQTvIoqx3FMH60L79VGj1Ma+81DnmliAi+0PZ6C55smj9hW4tE32tct99d8sQtitdpJ6KmKcxfcZMueu3v5dHnt4r65dWSDqRTWCKuRvoK52MjdVmPzVmTKUEd5JIa+asAumMpsm2vV3yL2+7SrLLp0tRLpoG+kk/KbdR7c0gAtO5HU0MfSrgM7R5UKuhtOrKuQ1DJNoLos2YY5Tcqr29NmKqhtRCgcBjz+DzBaZKAsX5ISKTKEUAmGhRWaWDscLpjLoFVzWtnDNntltbXV2diwaTiEJ0tryOzw0QsdjLEHg5CBiBvBz07NgXReD/ICTPruTJms2qn9SVRh9qy6Ebex8VUO0dLUzYa3JpqsYmnsbZPKdPK6PzfI78/Cd3S20/wvi0SllzxjrZ8cTjMsYxaseuHdxLKOWdPXMmT++dsnz1SukhPfWre+6Rhr4hKUxNlre+ZrPkMnZ2gs1YNQCNDjqwd1dPrKWkrLSTvAVblKFRogwMEtec+5rj6xjskD/efZcM0NUd4WvGjGrmdIwwmvY52XugRoYpF77oLJyGScONM89d7drHqR7T8bAhSCAVPaWyqkx2H+qVZ3Y3yLzKPHnPO9+hE3yJRDCR1NJeSKSX0b3jboNnngc6TDJRxxiFAMfH3cbcrBJNW7kKKSIv9e4aAj+dxvjcnmNUXfW4GSCp/gkoYVJG0FP0PcfTVBybQgQEeQ5iy6J2Jn70D7Vu19LqSSKgMG7FNsrW/vEmAgEjkESgaOf4XwhUkpb56Dvf7OZVqDeTuvMGlECmxiGUfqKQoxBIMzn6VJreWhHI05jeVyKldJ7f8YPfSSPpLx6XKen9knzxi1+RfG1K1IFLbNaV5Zgp5heQziJCmDtHyhDWb/3i56Ved2qe3q9evVBWnrvRVS3F6O6O8fQ+Sgf68nVnIZqHiUgGpJEBVBHVV0or5axzLpRAJp5Vk2Py2//4Nxlizobai2RnZDjxvosNvxtzyC2PPS8bVxVRkjyEtxaW63xcZXE+s0c6pIvqspKcTP6OyWHDgNSSuVs4rUDe8JqLxc95cnKz0XBCrkGR1m/pasezSmekQJwafY2hdwxzjVpOnJ1T6Ga1axWWzmrXMl4t3dU56P95718hmxGOHZGssJ/oA5NEUmj9zIZPJj+l5ooqwGu5tPp6uejGaR5YyNNtrukwm0Bo/2AThYARSKKQtPP8LwQ+/f6bmMaXLkmBkHOD1c1Qn9xj5Pbrjh5ic2YeBk/hTVhwqBYxd840SeFp+Z7b75dRXHc/8M/vkv+88w5ZvXqRPHrH75kFcnxuuYrYIZxxL2WUbIiKJa2Iuu0HP5AmCKYDMXo2G+vXfvBNnvY7pY+5JE1Yi2g/yByig3VXqgCvRwAAFNVJREFUXOscdI8ilE+yKZfg6rt63UbJLq6Ssd5G+fF3vkRUgIidVcDExAzSRkNuFK7ONzmw94D8ees+WVkYlrSKHCmgLLgwL4XzMCmQtNeRZxshn3HZ7w/LGTOKcd+tlJWUNQ9OJFNNli3ZFdOljs73dITtlpY2qru63FwU7UpPS2fcLGvyUbGlkVMvZb9qY6LGiTEt+aXJcde+o+gfTTLMUKmRwTEpziMFRRqrrYfSaB/RBSaUQRoyVXMKIB7pFMQ0qr60CTHMQCsVze1lCCQSASOQRKJp5/ofCBQjQv/LO66TMexKknyplKDS78Bm66fedf+uHeybbLz0Y9TX1Esu5bozZ0+XqtJc+Q5VWB/7zrdl8aJlPG1H5bYffl6SSGn95eEdEuAJW6Vm9ZeqwrIjiRTNAN3cDe2tEuQJu4uQp4uRrm84f7286Z9ej6i8i6bBLkbQdkpodFBe95730RlfA3ExB51H/4Licpm1YLGUzZgv2/98lzzz5EMyc94yBkNhP5J23ARR7dn7qYCqO3aUPow+OVCDPf0IG7WOxEUD8SFia6pJn/qL8jKlinLkDAR1nYao7NNFn0fltHKpnD2HVFo3xNbtxulGIAmNzkbQisLY2etsknSccbXMuY/Rv0kQi/ZDdjIkqoXj9hxqRBinHJhUVBAMdZxuP5YpWhSmOswohHHcnoTyXKKOIJVhPj+jgMHIXobAiUDACOREoGrndAhoquSWD76D2eKZglmH6wnRyqJMKpn2PLfV5ebbyOcfPHBEZlVXyGw8q6ZjAvjRT3xVkgpKZNbsmeTz06Tx2AHJRHzuZyOdJK0zSiTj588x3bR1TgbpGZ0EmMeGr1GOTttrC2XKB992JRVXYbe5Njc0SD+i99yiLMlfcQak0ssxAXSRArq1K/kqkUfv+6WbWZKWnosNig53QlvAGl69rCJs6FHKkvkAZ2rYwjRAJZUhdRpmDG1VWREENulG9frQMHKIjPKxZm9Be1Gxe8GSRZJVUk56i6FPew+7CEq9r3Q2ubrqptP8p7YnrtmSCjW1SNHoRKuvwgjeHVRrPfjodhx38fmi5VCJJZ+0WD+NiKpnqE27uvv6KFRQ08oAZdRqn69EZS9D4EQhYARyopC18zoEUrHY+MrH3+s2dn3SnqKzOy2YhADeji4xIsdq62QfG+pM0j0Lly+WQjb8mz/1NRmmxFQN/yYQ4dWBNpMUVyalrcnsuKM01AXJ90/yZK3mgikIxBUVpTK/pFDase1Qi48D9Hx0QlpXnbtWLr3iMiqgumj8q5MoekY+Jbw+yms1+kjFJyoXshqLtEhjYwNlrQxsysjjK1sGafJTsVq1mzFs4H0I1uNYjOhUwwhRxQA/10qpIdbmhG+mISZBank5uU6XUALqImKpmj5bymfMopmwT+qPHnOjbeEpKq0CTmvR0l3tJh+nisq573L9Wv6sn60Y5KD3bN95CAJ52kUsumaNbJQYUyAfdfxVR197GQKvNAJGIK804h78vOsuPwfLkZXMGm8m3TLlhN1hmvB0Q25papTHH90q1RDAwjWrpJgN+NO33CpDanwYykI7GaYEFkGYsld9uh5FPNZ54Z/89C2Sj1aRlZch25gVUs6Uwt/e9Rt0h2o55+zNcgu9IlNkbpRYItFxueLiC2R6WQGzQtpcV7yfSKJw/gJcffOx8+DJP9LB+7UnQu3VM9j88dFqqnVRwjhRRZDhUloWrMcOIXYrgUR6dF45mz7RkJoT0uDt9I3iomKqxejjgATyGGUbSA1LQ12t1OBBNY4ekZGB1sE6dY6Hpp20WkqHbo0gquv51aQYXkHP8LlIRrvUn9qxH7t27Wo/Xmml1uzp6EtaHm0vQ+BkIWAEcrKQ99jn3nrzu900vX6eyDNy84kqYhgOxlyn9b33PixzisJStWqdZPG0/51/+YI06SM641+n6FXIJlrQ1E03NijqshsMoINgQb5kxWI2/n60FZF9DHKqrKiQj2CuOEI57Pe/eytVSszuGPVJhDJXH6JyGh3fYXbn93/8JukfGscKvUsWMz8kyCacRTqIK4KkSL2xYfegqQxSraWNfDGuNRjQ+RvqkZXsopCutianU0R0rGwq32fqYEDF/XAmFVf5ks7oW9V71Lqlm2vsRu/Ys++w1NP70T/ImFqqttSSXg0hY5TuHh8idXwsoDOC5Dq1oEB1kHGiMPXR0lRVJiW4qZg22ssQOBUQMAI5Fe6CB65h49rlctmGZcQcpLUoJR2kv0J9qLIzUuXu3/4RB9l+qUafOO+Sc+Wp390vD255THrJ6UcxNQzytJ1GH8UYqaIerNrP3bROHsLGfYR0j+61KaShMpn93YpHlOb803n6LytgbvjAGGJ2Jk/86ZS9splTSVVKU+IF117MpEL1smqmH8MvG87ZJLMXzJKk9CIsQxgHy+dor0onnd8q4utnBCAQ1SqSIAolhr5uNBCdoY5NipYbK99lcB1+HTdLmW4TNiPa2HeMWR2NOPniIy+jHKelwempGllkEL2MShtd74OYP2ZRklyEf5famLQy6vcIZpHasa4VWek0ZmqjoV6IleB64B/LabREI5DT6Gad7pf6f970WlkwvQxBPZlNWm3OY86+pC8yJl/50ldlfnmJlEwroWx3hTRR6fSL7/2HdFJq69NmQG2IY3NWrWHBvLkyiw5xLQ1WR9sLzruAJ/0uNxxKLdA72tuwCulyDYTjpMqysC4ZRJgewyZ95txpMm3uDGmko7uLWSRZpJO03FZTXVVzF8nW++6XWfNmSFZpEVVXx1yko1MIqW1yG7ieM4L2MUJTYz89Ip2I8V1MP/SnBvDX8sn2XbWQ5BRrInqBVbRgoCI/U+bNKJNqUmhlREnap5FXVOps43VIVN2hfbJ3F3PV6emgPEBqW3so1TXx+3T/fffC9RuBeOEunyJrzKRf45YPvYtUjE7cm3Tz0kPoGUODPXLk0FF55LFnJJ9xrXkFWTJ36WLJoXfhkXv+xAZbh2ttvzMvTCaFpBEHWSk0gAwJQyxa0qqOv6MI7EnoEdpnorYiASKJTIZRlZUWSDojbQPZOlQqW/YdrZVpM2fTBU+3N9GKelplU+nUwKjb9rpGCWErv2T1Wr4/SrpplPcx11wnLPL5g5TRatOfmjTq2Np+mhFbO/qlhdkftY2dzi1Xm/ZS0E6uvWKTzK0qpkBgGtFL2E0MLJm3hBG5z8lA40EKA3Jc97o2KRZhrVJQlC87d+6Qu7ZsI8VFXs5ehsApjoARyCl+g15tl1dFh/rH3nuDE461a3pigj4LLcWFSHQA04P3b+HPPslmcycHxJTCFa7SKJ2Nto+hVEmQhXpb9bYziAmH20EqotKwkNeejBjVWRM4z2YWF7jmvHSqocLanEcl04aLrpCZy1e578e66qWzpdkNYdI00s7nn5Wjx+rkKBbpAWaa5xQXS67zqFKCYf44ZBBws8OJgvj8CHPGY5Tu9hOJHKaLvrUrIgeJmLT6KwsC3LxhubzrxmskguHiIJHI9ie3yvQFS6S4eobsOdooeTQNzlowR2JRSoN7O9Bb2mUflvOH6luluTvqRufayxA4HRAwAjkd7tKr7BrPWrtErrriIvZy5mTQxzAxNkTHtVYU4dfERn3s4F5Kaptcaqgd/yedW6Fd1BPoE2qznpuVLlE22RFKWrV8NcyXDtAdgyii9ICUkiZay6yR8845W4JF0/8/9LQBsFfGsVbRmeQxzB3VikS7uf/68F8gpF7E+BLJxTdL/agmIIps9ImUF+aWax+LWrEcPNbC9WG6iL/V0WONOPGmyFtef6HMYk6JNvBpuk0b+IIMwVKNo6upBWIrQtegDJer7aWH5Mmtz8heoqtu/m4vQ+B0RMAI5HS8a6+Ca37jFWfLqpVLSQcxsY+yWBWLwxmZzn58jLkagzQdNlP2W8vAKe3BUGNBfY9GDNqYp4JEJiWzaWzsYUp+i/OyGahUjhBd7CzeM/PzJSlnGu/7byMEHW4cO8F0QEq3ulrr6UHZ5aqp+jBPPIrmoX0nJRgs6iCrED0hPkhEXXtp03PVUNtIP3XjfvvcroNSXJArr7n0PFJkJaTd8l3lVBLC+RQprhYij9/ds4V+lwEZoNIsxjWrwK828fqnuhDbyxA43REwAjnd7+Bpev1a8nrJWWtkPdVZo/RGqBut7vXZDHnSLd+NdEUj6SNdpHNB1EhQh1Jp212U3hCduxEkKtFGPJR1CRMB5BfSwEf5bBFzMWbg1ptKgyAuiS+QRkx2bX1SDuzbRZkv9vLUyk6ptTkEFiOy0ZfOJE+jkTETbYXTub9LMOw0ja4OGhGpuNJK2yTfJKaPRTj5IohDMlp2q3M1jh49Ivfe/5DUNLa5a7SXIfBqR8AI5NV+h0/h9emEvHPXLZO1S+e7MlUd4OrHgiOVElvt0tZmO+2vON6ZPeb6SEZ4mtcpfipgqy7hXGax7NCJsNpUp/+dQSRTymQ+JakIvlLqphulAitMX0lObh4CN2W3MEG0HzNHNJO0VIZMoXUEaXBUgV61mXR0Fe0C12DHzStnsIlGDyq6u9kmEJeP7nF1utUU1G0//7XsO3TMIotT+PfNLi3xCBiBJB5TO+NLRGDVollyAUSSQvQQSA25XowUdI1U9AO/joBlC5+kUmoKAhnnZxqx6GwQ9aQaob9DPaCm2Nw1QhlDY1B7kTAVXzpfPARphEl1udka2mkOwYzQzNgPeeh42Vys4IlhtHuQyCLgPncCXSSZVFoPPlbZxSU0CnI85bzqH6IVW2qzrhMMe0l9PUw/yr0PPPISV2xvNwReHQgYgbw67uNpv4owvRqvv2iDFNMRrhP5UrEhR1KXMHYlOis8xjyQ8VFKW0lrqYHilM5Id0br/C/ag5os6ktJJKCRAdGHEohan2j5bSoNhdp/MUVqbJSoYyhK2gwyeuiPd8sYvRdaVRXEi6QYP62qyjKpqp7FNMMc8YcptcVSRV8681zJQ6uttjz0sPzx/odPe9xtAYbAy0HACOTloGfHJhyBEKW1rzt7JVVQmfhcFTqRXNNYyegcWtWkneHa0KfjcdUbS6uzVINQ/6gk3uPKbnGjVfFbOUWJhuQTJbi8l4FRYdJU3/r0pyWJHhOdIZ6FU7CaEupJCgqKEeIr3PTAJNd5rj/zEfUMugioD0PGn97+O9l98FjC120nNARORwSMQE7Hu/Yqv2adOqgRSUF2uiycWSbTykqxxQqjT6BsK3uofbu60KJXOD90ohL9vnap+14gmmTVM5g+6Cctpu61wclRefJPf5AeBlhlM6xKBXrthA/wPp0/XoTjbQY+UymkzUIYLPrpAdGGxL7eHrl/yxZ56tndCPlMDCRlZi9DwBA4joARiP0mnPII+CCAwtwsynZDTAkMSQnVVsWFBczbUGNBBiZpSks1EIRtnamh7rp+jUSoqupHRH/m2e3Sh/lhNp5YxWXlGB6muzSWzkvPyc5hkNU8ynCLJJV0WS3NfNu3PyvPPfe8KyHuQIC3kttT/lfELvAkIWAEcpKAt49NFAJTVFEFJR3DxSzcbbVyS6uttAw4it1ILeNytXqqqjhb1tJ3ksWYWiUOLcedIL01SPlwDz0bNcxnb2pusQFMibotdh5PIGAE4onbbIs0BAwBQyDxCBiBJB5TO6MhYAgYAp5AwAjEE7fZFmkIGAKGQOIRMAJJPKZ2RkPAEDAEPIGAEYgnbrMt0hAwBAyBxCNgBJJ4TO2MhoAhYAh4AgEjEE/cZlukIWAIGAKJR8AIJPGY2hkNAUPAEPAEAkYgnrjNtkhDwBAwBBKPgBFI4jG1MxoChoAh4AkEjEA8cZttkYaAIWAIJB4BI5DEY2pnNAQMAUPAEwgYgXjiNtsiDQFDwBBIPAJGIInH1M5oCBgChoAnEDAC8cRttkUaAoaAIZB4BIxAEo+pndEQMAQMAU8gYATiidtsizQEDAFDIPEIGIEkHlM7oyFgCBgCnkDACMQTt9kWaQgYAoZA4hEwAkk8pnZGQ8AQMAQ8gYARiCdusy3SEDAEDIHEI2AEknhM7YyGgCFgCHgCASMQT9xmW6QhYAgYAolHwAgk8ZjaGQ0BQ8AQ8AQCRiCeuM22SEPAEDAEEo+AEUjiMbUzGgKGgCHgCQSMQDxxm22RhoAhYAgkHgEjkMRjamc0BAwBQ8ATCBiBeOI22yINAUPAEEg8AkYgicfUzmgIGAKGgCcQMALxxG22RRoChoAhkHgEjEASj6md0RAwBAwBTyBgBOKJ22yLNAQMAUMg8QgYgSQeUzujIWAIGAKeQMAIxBO32RZpCBgChkDiETACSTymdkZDwBAwBDyBgBGIJ26zLdIQMAQMgcQjYASSeEztjIaAIWAIeAIBIxBP3GZbpCFgCBgCiUfACCTxmNoZDQFDwBDwBAJGIJ64zbZIQ8AQMAQSj4ARSOIxtTMaAoaAIeAJBIxAPHGbbZGGgCFgCCQeASOQxGNqZzQEDAFDwBMIGIF44jbbIg0BQ8AQSDwCRiCJx9TOaAgYAoaAJxAwAvHEbbZFGgKGgCGQeASMQBKPqZ3REDAEDAFPIGAE4onbbIs0BAwBQyDxCBiBJB5TO6MhYAgYAp5AwAjEE7fZFmkIGAKGQOIRMAJJPKZ2RkPAEDAEPIGAEYgnbrMt0hAwBAyBxCNgBJJ4TO2MhoAhYAh4AgEjEE/cZlukIWAIGAKJR8AIJPGY2hkNAUPAEPAEAkYgnrjNtkhDwBAwBBKPgBFI4jG1MxoChoAh4AkEjEA8cZttkYaAIWAIJB4BI5DEY2pnNAQMAUPAEwgYgXjiNtsiDQFDwBBIPAJGIInH1M5oCBgChoAnEDAC8cRttkUaAoaAIZB4BIxAEo+pndEQMAQMAU8gYATiidtsizQEDAFDIPEIGIEkHlM7oyFgCBgCnkDACMQTt9kWaQgYAoZA4hEwAkk8pnZGQ8AQMAQ8gUCSJ1ZpizQEDAFDwBBIOAJGIAmH1E5oCBgChoA3EDAC8cZ9tlUaAoaAIZBwBIxAEg6pndAQMAQMAW8gYATijftsqzQEDAFDIOEIGIEkHFI7oSFgCBgC3kDACMQb99lWaQgYAoZAwhEwAkk4pHZCQ8AQMAS8gYARiDfus63SEDAEDIGEI/D/ADVg3ubhVH4CAAAAAElFTkSuQmCC","cameraPositionInitial":{"cameraType":"arcRotateCam","position":{"x":10.555990343683439,"y":48.78734039815878,"z":-2.5364804457811183},"target":{"x":0,"y":0,"z":0}},"background":{"color":{"r":51,"g":51,"b":51,"a":229.5},"effect":false},"lights":[{"type":"HemisphericLight","position":{"x":0,"y":-1,"z":0},"intensity":1},{"type":"HemisphericLight","position":{"x":0,"y":1,"z":0},"intensity":1},{"type":"PointLight","position":{"x":1,"y":10,"z":1},"intensity":1}],"rotation":{"x":0,"y":0,"z":0},"scale":1}`);

  // The entity gets validated inside of the metadata/entity component
  // but we also keep track of validation inside of the wizard
  public entity = { ...baseEntity(), ...baseDigital() };
  public isEntityValid = false;
  public entityMissingFields: string[] = [];

  constructor(
    public uploadHandler: UploadHandlerService,
    private uuid: UuidService,
    private mongo: MongoHandlerService,
  ) {
    window.onmessage = async message => {
      const type = message.data.type;
      switch (type) {
        case 'resetQueue':
          const didQueueReset = await this.uploadHandler.resetQueue();
          if (didQueueReset) {
            this.SettingsResult = undefined;
            this.UploadResult = undefined;
            this.uuid.reset();
          }
          break;
        case 'addFile': this.uploadHandler.addToQueue(message.data.file); break;
        case 'fileList':
          console.log(message.data);
          this.uploadHandler.addMultipleToQueue(message.data.files);
          this.uploadHandler.setMediaType(message.data.mediaType);
          break;
        case 'settings': this.SettingsResult = message.data.settings; break;
        default: console.log(message.data);
      }
    };

    this.JSONEntityToValidationEntity();

    this.uploadHandler.$UploadResult.subscribe(result => this.UploadResult = result);
  }

  ngAfterViewInit() {
  }

  public validateEntity() {
    console.log('Validating entity:', this.entity);
    this.entityMissingFields.splice(0, this.entityMissingFields.length);
    let isValid = true;

    const validateObject = (obj: any) => {
      for (const property in obj) {
        if (!obj.hasOwnProperty(property)) {
          continue;
        }
        const current = obj[property];
        const value = current.value;
        const isRequired = current.required;
        const isArray = Array.isArray(value);
        const isString = typeof value;
        // Skip non-required strings
        // Additional Typechecking is in place because
        // we are not using any TypeScript checking here
        if (!isRequired && !isArray && isString) {
          continue;
        }

        // If we have an array, walk over its entries
        if (isArray) {
          const isEmpty = (value as any[]).length === 0;
          // Check for isEmpty and isRequired
          // because there are optional arrays that can contain
          // objects that _are_ required
          if (isEmpty && isRequired) {
            this.entityMissingFields.push(`${property} can't be empty`);
            isValid = false;
          } else {
            for (const element of (value as any[])) {
              validateObject(element);
            }
          }
        } else if (isString) {
          const isEmpty = (value as string).length === 0 || (value as string) === '';
          if (isEmpty) {
            this.entityMissingFields.push(`${property} can't be empty`);
            isValid = false;
          }
        } else {
          console.log('Unknown hit in validation', property, current);
        }
      }
    };

    // Walk over every property of entity
    validateObject(this.entity);
    this.isEntityValid = isValid;
    console.log('Invalid fields on entity:', this.entityMissingFields);
    this.validationEntityToJSONEntity();
    return this.isEntityValid;
  }

  public validationEntityToJSONEntity() {
    const walk = (obj: any) => {
      const resultObj: any = {};
      if (typeof obj === 'string') {
        return obj;
      }

      for (const prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
          continue;
        }
        const current = obj[prop];
        const value = obj[prop].value;
        const isArray = Array.isArray(value);
        const isString = typeof value === 'string';

        if (!isArray && isString) {
          resultObj[prop] = value;
        } else if (isArray && !isString) {
          resultObj[prop] = (value as any[]).map(walk);
        } else {
          switch (prop) {
            case 'address':
            case 'place':
              resultObj[prop] = walk(value);
              break;
            default:
              console.log('Unkown hit in conversion', current, prop, obj, obj[prop]);
          }
        }
      }
      return resultObj;
    };

    const resultEntity = walk(this.entity);
    console.log('Validation entity converted to JSON:', resultEntity);
    return resultEntity;
  }

  public JSONEntityToValidationEntity() {
    const mock = `{"_id":"","title":"tit","description":"desc","externalId":[{"type":"extid","value":"extid"}],"externalLink":[{"description":"extlink","value":"extlink"}],"metadata_files":[],"persons":[{"name":"pers","prename":"pers","mail":"pers","role":["RIGHTS_OWNER","CONTACT_PERSON"],"note":"pesrn","phonenumber":"pesrno","institution":[{"name":"nested inst","address":{"building":"nested inst","number":"nested inst","street":"nested inst","postcode":"nested inst","city":"nested inst","country":"nested inst"},"role":["RIGHTS_OWNER","EDITOR"],"university":"nested inst","note":"nested inst"}]}],"institutions":[{"name":"inst","address":{"building":"inst","number":"inst","street":"inst","postcode":"inst","city":"inst","country":"inst"},"role":["DATA_CREATOR","CONTACT_PERSON"],"university":"inst","note":"inst"}],"type":"digtyp","licence":"BY","discipline":["disc"],"tags":["tag"],"dimensions":[{"type":"dim","value":"dim","name":"dim"}],"creation":[{"technique":"cre","program":"cre","equipment":"cre","date":"cre"}],"files":[],"statement":"digstat","objecttype":"","phyObjs":[{"_id":"","title":"phytit","description":"phydesc","externalId":[{"type":"phyextid","value":"phyextid"}],"externalLink":[{"description":"phyextlink","value":"phyextlink"}],"metadata_files":[],"persons":[{"name":"phypers","prename":"phypers","mail":"phypers","role":["RIGHTS_OWNER","CONTACT_PERSON"],"note":"phypers","phonenumber":"phypers","institution":[{"name":"phypers nested inst","address":{"building":"phypers nested inst","number":"phypers nested inst","street":"phypers nested inst","postcode":"phypers nested inst","city":"phypers nested inst","country":"phypers nested inst"},"role":["EDITOR","DATA_CREATOR"],"university":"phypers nested inst","note":"phypers nested inst"}]}],"institutions":[{"name":"phyinst","address":{"building":"phyinst","number":"phyinst","street":"phyinst","postcode":"phyinst","city":"phyinst","country":"phyinst"},"role":["RIGHTS_OWNER","CREATOR","EDITOR","DATA_CREATOR","CONTACT_PERSON"],"university":"phyinst","note":"phyinst"}],"place":{"name":"phypl","geopolarea":"phygeo","address":{"building":"phyaddr","number":"phyaddr","street":"phyaddr","postcode":"phyaddr","city":"phyaddr","country":"phyaddr"}},"collection":"phycol"}]}`;
    const _parsed = JSON.parse(mock);

    // Helper function to fill an array with length of 'length'
    // with the resulting base validation object of 'func'
    const arrBase = (func: () => any, valArr: any[]) => {
      const arr = new Array(valArr.length);
      for (let i = 0; i < valArr.length; i++) {
        arr[i] = walkSimple(valArr[i], func);
      }
      return arr;
    };

    // Walk simple object types, e.g. person, institution, link, id...
    const walkSimple = (parsed: any, func: () => any) => {
      const newSimple = { ...func() };
      for (const prop in parsed) {
        if (!parsed.hasOwnProperty(prop)) {
          continue;
        }

        const value = parsed[prop];
        const isArray = Array.isArray(value);
        const isString = typeof value === 'string';
        if (!isArray && isString) {
          newSimple[prop].value = value;
        } else if (isArray && !isString) {
          switch (prop) {
            case 'institution':
              newSimple[prop].value = arrBase(baseInstitution, value);
              break;
            default:
              // Assume string array
              newSimple[prop].value = value;
          }
        } else {
          switch (prop) {
            case 'address':
              newSimple[prop].value = walkSimple(value, baseAddress);
              break;
            case 'place':
            default:
              console.log('Unknown hit in simple', prop, value, parsed);
          }
        }
      }
      return newSimple;
    };

    // Walk digital or physical entities, which are the 2 top level types
    const walkEntity = (parsed: any, isPhysical = false) => {
      // Base to be overwritten
      const newBase = isPhysical
        ? { ...baseEntity(), ...basePhysical() }
        : { ...baseEntity(), ...baseDigital() };

      for (const prop in parsed) {
        if (!parsed.hasOwnProperty(prop)) {
          continue;
        }

        const value = parsed[prop];
        const isArray = Array.isArray(value);
        const isString = typeof value === 'string';
        if (!isArray && isString) {
          newBase[prop].value = value;
        } else if (isArray && !isString) {
          const valArr: any[] = (value as any[]);
          const len = valArr.length;
          switch (prop) {
            case 'externalId':
              newBase[prop].value = arrBase(baseExternalId, valArr);
              break;
            case 'externalLink':
              newBase[prop].value = arrBase(baseExternalLink, valArr);
              break;
            case 'persons':
              newBase[prop].value = arrBase(basePerson, valArr);
              break;
            case 'institutions':
              newBase[prop].value = arrBase(baseInstitution, valArr);
              break;
            case 'dimensions':
              newBase[prop].value = arrBase(baseDimension, valArr);
              break;
            case 'creation':
              newBase[prop].value = arrBase(baseCreation, valArr);
              break;
            case 'phyObjs':
              newBase[prop].value = new Array(len);
              for (let i = 0; i < len; i++) {
                newBase[prop].value[i] = walkEntity(valArr[i], true);
              }
              break;
            default: newBase[prop].value = value;
          }
        } else {
          switch (prop) {
            case 'place':
              newBase[prop] = {
                required: false,
                value: walkSimple(value, basePlace),
              };
              break;
            default: console.log('Unknown hit in parsing', prop, value);
          }
        }
      }
      return newBase;
    };

    const _base = walkEntity(_parsed);
    console.log('JSON entity parsed to validation Entity:', _base);
    this.entity = (_base as unknown as any);
    this.validateEntity();
  }

  public debug(event: any) {
    console.log(event, this);
  }

  public stringify(input: any) {
    return JSON.stringify(input);
  }

  // Finalize the Entity
  public canFinish() {
    return this.isEntityValid
      && this.SettingsResult !== undefined
      && this.UploadResult !== undefined
      && this.UploadResult.status === 'ok';
  }

  public async tryFinish() {
    console.log(this.entity, this.SettingsResult, this.UploadResult);
    const digitalEntity = {...this.validationEntityToJSONEntity()};
    const serverEntity = await this.mongo.pushDigitalEntity(digitalEntity)
      .then(result => {
        console.log('Got DigitalEntity from server:', result);
        const files = (this.UploadResult.files as IFile[])
          .sort((a, b) => b.file_size - a.file_size);
        const entity: IEntity = {
          _id: '',
          name: result.title,
          annotationList: [],
          files: this.UploadResult.files,
          settings: this.SettingsResult,
          finished: false,
          online: false,
          mediaType: this.uploadHandler.mediaType,
          dataSource: { isExternal: false },
          relatedDigitalEntity: {
            _id: result._id,
          },
          processed: {
            raw: files[0].file_link,
            high: files[Math.floor(files.length * 1 / 3)].file_link,
            medium: files[Math.floor(files.length * 2 / 3)].file_link,
            low: files[files.length - 1].file_link,
          },
        };
        console.log('Saving entity to server:', entity);
        return entity;
      })
      .then(entity => this.mongo.pushEntity(entity))
      .then(result => {
        console.log('Saved entity to server', result);
        return result;
      })
      .catch(e => console.error(e));

    if (serverEntity) {
      // TODO: Success
    } else {
      // TODO: Error handling
    }
  }

}
